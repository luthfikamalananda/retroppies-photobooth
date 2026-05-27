export interface HardwareStatus {
  cameraAvailable: boolean
  printerAvailable: boolean
}

export async function checkHardware(): Promise<HardwareStatus> {
  // Check camera via browser MediaDevices API
  let cameraAvailable = false
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    cameraAvailable = devices.some(d => d.kind === 'videoinput')
  } catch {
    cameraAvailable = false
  }

  // Check printer via Electron IPC if available, otherwise assume true
  let printerAvailable = false
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const electronAPI = (window as any).electronAPI
    if (electronAPI?.checkPrinter) {
      printerAvailable = await electronAPI.checkPrinter()
    } else {
      printerAvailable = true // fallback for browser dev mode
    }
  } catch {
    printerAvailable = true
  }

  return { cameraAvailable, printerAvailable }
}
