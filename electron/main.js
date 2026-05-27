const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    kiosk: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    frame: false,
  })

  const isDev = !app.isPackaged
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC: Printer capability check
ipcMain.handle('check-printer', async () => {
  try {
    const printers = await mainWindow.webContents.getPrintersAsync()
    return printers.length > 0
  } catch {
    return false
  }
})

// IPC: Print final image
ipcMain.handle('print-image', async (_event, _imageDataUrl) => {
  try {
    await mainWindow.webContents.print({ silent: false, printBackground: true })
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})
