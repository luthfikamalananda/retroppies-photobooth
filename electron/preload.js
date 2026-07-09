const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  checkPrinter: () => ipcRenderer.invoke("check-printer"),
  printPhotoSilent: (base64, paperWidth, paperHeight) => {
    console.log("aku jalannn di preload");
    console.log(
      "ipcRenderer",
      ipcRenderer.invoke("print-photo-silent", {
        base64,
        paperWidth,
        paperHeight,
      }),
    );
    return ipcRenderer.invoke("print-photo-silent", {
      base64,
      paperWidth,
      paperHeight,
    });
  },
  printPhotoBorderless: (params) =>
    ipcRenderer.invoke("print-photo-borderless", params),
  transcodeToMp4: (bytes, durationSec) =>
    ipcRenderer.invoke("transcode-to-mp4", { bytes, durationSec }),
});
