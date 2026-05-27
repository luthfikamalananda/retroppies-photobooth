const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  checkPrinter: () => ipcRenderer.invoke('check-printer'),
  printImage: (dataUrl) => ipcRenderer.invoke('print-image', dataUrl),
})
