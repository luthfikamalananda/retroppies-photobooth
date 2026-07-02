const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFile } = require("child_process");

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
            } catch {}
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
            } catch {}
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

app.commandLine.appendSwitch('disable-gpu-video-decode')

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

