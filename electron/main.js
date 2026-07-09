const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFile } = require("child_process");

// Path binary ffmpeg (dari ffmpeg-static). Saat dikemas, binary di-unpack dari arsip
// asar (lihat "asarUnpack" di package.json) → path require menunjuk ke dalam app.asar,
// jadi harus dialihkan ke app.asar.unpacked agar file benar-benar bisa dieksekusi.
const ffmpegStaticPath = require("ffmpeg-static");
const ffmpegPath = app.isPackaged
  ? ffmpegStaticPath.replace("app.asar", "app.asar.unpacked")
  : ffmpegStaticPath;

let mainWindow;

console.log("MAIN PROCESS START");
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    kiosk: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    frame: true,
  });

  // TEMPORARY DEBUG — log error loading ke console main process juga
  mainWindow.webContents.openDevTools({ mode: "detach" });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");

    // TEMPORARY DEBUG — log error loading ke console main process juga
    mainWindow.webContents.openDevTools({ mode: "detach" });

    // TEMPORARY DEBUG — log error loading ke console main process juga
    mainWindow.webContents.on(
      "did-fail-load",
      (event, errorCode, errorDescription, validatedURL) => {
        console.error("=== FAILED TO LOAD ===");
        console.error("errorCode:", errorCode);
        console.error("errorDescription:", errorDescription);
        console.error("validatedURL:", validatedURL);
      },
    );
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.commandLine.appendSwitch('disable-gpu-video-decode')
app.commandLine.appendSwitch('disable-software-rasterizer')

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// IPC: List semua printer + paper size yang tersedia (untuk debugging)
// Gunakan ini dulu untuk melihat nama EXACT paper size borderless di driver kamu
// ─────────────────────────────────────────────────────────────────────────
ipcMain.handle("list-printers-debug", async () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const printers = await win.webContents.getPrintersAsync();

  // Print full detail termasuk paper sizes yang didukung tiap printer
  printers.forEach((p) => {
    console.log("=== PRINTER:", p.name, "===");
    console.log(JSON.stringify(p.options, null, 2));
  });

  return printers;
});

// ─────────────────────────────────────────────────────────────────────────
// Handler: True borderless print — cross-platform
// Windows → PowerShell + .NET PrintDocument (paper size dari driver)
// macOS   → CUPS `lp` command (paper size dari CUPS, misal "A4.NMgn")
// ─────────────────────────────────────────────────────────────────────────
ipcMain.handle(
  "print-photo-borderless",
  async (_, { base64, printerName, paperName, totalCopy }) => {
    const tempImagePath = path.join(os.tmpdir(), `print-${Date.now()}.jpg`);
    fs.writeFileSync(tempImagePath, Buffer.from(base64, "base64"));

    if (process.platform === "win32") {
      const scriptPath = app.isPackaged
        ? path.join(process.resourcesPath, "print-borderless.ps1")
        : path.join(__dirname, "print-borderless.ps1");

      // Pastikan file script benar2 ada sebelum dipanggil — kalau tidak,
      // error PowerShell soal ekstensi file akan muncul karena path kosong/salah.
      if (!fs.existsSync(scriptPath)) {
        fs.unlinkSync(tempImagePath);
        throw new Error(`Script tidak ditemukan di path: ${scriptPath}`);
      }

      const args = [
        "-ExecutionPolicy",
        "Bypass",
        "-NoProfile",
        "-File",
        scriptPath,
        "-ImagePath",
        tempImagePath,
        "-PrinterName",
        printerName,
        "-PaperName",
        paperName || "A4 210 x 297 mm",
        "-Copies",
        String(totalCopy),
      ];

      console.log("Menjalankan PowerShell dengan args:", args);

      return new Promise((resolve, reject) => {
        execFile(
          "powershell.exe",
          args,
          { windowsHide: true },
          (error, stdout, stderr) => {
            try {
              fs.unlinkSync(tempImagePath);
            } catch { }
            if (error) {
              console.error("PowerShell print error:", stderr || error.message);
              reject(new Error(stderr || error.message));
              return;
            }
            console.log("PowerShell print output:", stdout);
            resolve(true);
          },
        );
      });
    }

    if (process.platform === "darwin") {
      return new Promise((resolve, reject) => {
        execFile(
          "lp",
          [
            "-d",
            printerName,
            "-n",
            String(totalCopy),
            "-o",
            `media=${paperName || "A4.NMgn"}`,
            "-o",
            "fit-to-page",
            tempImagePath,
          ],
          {},
          (error, stdout, stderr) => {
            try {
              fs.unlinkSync(tempImagePath);
            } catch { }
            if (error) {
              console.error("lp print error:", stderr || error.message);
              reject(new Error(stderr || error.message));
              return;
            }
            console.log("lp print output:", stdout);
            resolve(true);
          },
        );
      });
    }

    fs.unlinkSync(tempImagePath);
    throw new Error(
      `Platform ${process.platform} belum didukung untuk borderless print`,
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────
// Handler: Transcode video composite WebM (VP8) → MP4 (H.264) kompatibel iOS.
// Renderer hanya bisa menghasilkan VP8/WebM via MediaRecorder, sedang iOS Safari
// butuh H.264 + yuv420p + moov atom di depan (+faststart). Kita transcode di sini
// (main process) dengan ffmpeg native — libx264 (CPU-only, agnostik GPU/CPU vendor).
// Lihat docs/adr/0003-transcode-video-composite-ke-mp4-h264-untuk-ios.md
// ─────────────────────────────────────────────────────────────────────────
ipcMain.handle("transcode-to-mp4", async (_, { bytes, durationSec }) => {
  const stamp = Date.now();
  const inPath = path.join(os.tmpdir(), `composite-${stamp}.webm`);
  const outPath = path.join(os.tmpdir(), `composite-${stamp}.mp4`);

  const cleanup = () => {
    try { fs.unlinkSync(inPath); } catch { }
    try { fs.unlinkSync(outPath); } catch { }
  };

  fs.writeFileSync(inPath, Buffer.from(bytes));

  const args = [
    "-y",
    "-i", inPath,
    // H.264 yuv420p (4:2:0) wajib dimensi genap. Ukuran composite dari template bisa
    // ganjil (mis. 900x1273) → bulatkan ke genap terdekat agar libx264 tak menolak.
    "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-pix_fmt", "yuv420p",      // wajib untuk iOS Safari
    "-movflags", "+faststart",  // moov atom di depan → bisa stream progресif
    "-an",                       // tak ada audio (video di-composite muted)
  ];
  // Kunci durasi output = countdown (metadata durasi WebM sumber tak reliable).
  if (Number.isFinite(durationSec) && durationSec > 0) {
    args.push("-t", String(durationSec));
  }
  args.push(outPath);

  return new Promise((resolve, reject) => {
    execFile(
      ffmpegPath,
      args,
      { windowsHide: true, maxBuffer: 1024 * 1024 * 64 },
      (error, _stdout, stderr) => {
        if (error) {
          cleanup();
          console.error("[transcode-to-mp4] ffmpeg gagal:", stderr || error.message);
          reject(new Error(stderr || error.message));
          return;
        }
        try {
          const mp4 = fs.readFileSync(outPath);
          cleanup();
          console.log("[transcode-to-mp4] OK. MP4 size:", mp4.length, "bytes");
          // Uint8Array aman dilewatkan structured-clone lewat IPC.
          resolve(new Uint8Array(mp4));
        } catch (e) {
          cleanup();
          reject(e);
        }
      },
    );
  });
});

// IPC: Printer capability check
ipcMain.handle("check-printer", async () => {
  const win = BrowserWindow.getFocusedWindow();
  try {
    const printers = await win.webContents.getPrintersAsync();
    return printers.length > 0;
  } catch {
    return false;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

