const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

let mainWindow;

console.log("MAIN PROCESS START");
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    kiosk: false,
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
    mainWindow.webContents.openDevTools({ mode: "detach" });
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

// Handler untuk silent print
ipcMain.handle(
  "print-photo-silent",
  async (_, { base64, paperWidth, paperHeight }) => {
    // Tulis file di main — full Node.js access, tidak ada masalah
    const tempPath = path.join(os.tmpdir(), `print-${Date.now()}.jpg`);
    fs.writeFileSync(tempPath, Buffer.from(base64, "base64"));

    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: true,
        webSecurity: false,
      },
    });

    const normalizedPath = tempPath.replace(/\\/g, "/");
    const html = `<!DOCTYPE html>
<html>
  <head>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      @page { size: ${paperWidth}mm ${paperHeight}mm; margin: 0; }
      html, body { width: ${paperWidth}mm; height: ${paperHeight}mm; overflow: hidden; }
      img { display: block; width: 100%; height: 100%; object-fit: fill; }
    </style>
  </head>
  <body>
    <img src="file://${normalizedPath}" />
  </body>
</html>`;

    await printWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
    );

    await printWindow.webContents.executeJavaScript(`
    new Promise((resolve, reject) => {
      const img = document.querySelector('img')
      if (!img) return reject('no img')
      if (img.complete && img.naturalWidth > 0) return resolve()
      img.onload = resolve
      img.onerror = reject
    })
  `);

    const printers = await printWindow.webContents.getPrintersAsync();
    const defaultPrinter = printers.find((p) => p.isDefault) ?? printers[0];

    return new Promise((resolve, reject) => {
      printWindow.webContents.print(
        {
          silent: true,
          printBackground: true,
          deviceName: defaultPrinter?.name ?? "",
          margins: { marginType: "none" },
          pageSize: {
            width: paperWidth * 1000,
            height: paperHeight * 1000,
          },
          copies: 1,
          color: true,
          scaleFactor: 100,
        },
        (success, failureReason) => {
          printWindow.close();
          try {
            fs.unlinkSync(tempPath);
          } catch {}
          if (success) resolve(true);
          else reject(new Error(failureReason));
        },
      );
    });
  },
);

// IPC: Printer capability check
ipcMain.handle("check-printer", async () => {
  const win = BrowserWindow.getFocusedWindow();
  try {
    // const printers = await mainWindow.webContents.getPrintersAsync();
    const printers = await win.webContents.getPrintersAsync();
    return printers.length > 0;
  } catch {
    return false;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
