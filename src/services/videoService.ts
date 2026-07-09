// Transcode video composite WebM (VP8) → MP4 (H.264) yang bisa diputar iPhone.
// Renderer/MediaRecorder hanya menghasilkan VP8/WebM; iOS Safari butuh H.264 + yuv420p
// + faststart. Konversi dilakukan di Electron main process via ffmpeg native (libx264).
// Lihat docs/adr/0003-transcode-video-composite-ke-mp4-h264-untuk-ios.md
//
// Sengaja TIDAK ada fallback ke WebM: bila transcode gagal, lempar error agar operator
// mengulang sesi — jangan pernah menyimpan video yang tak bisa diputar iPhone.

const isElectron = () =>
  typeof window !== "undefined" &&
  typeof (window as any).electronAPI?.transcodeToMp4 === "function";

/**
 * Transcode blob WebM menjadi Blob MP4 (video/mp4).
 * @param webmBlob    hasil composite dari MediaRecorder (VP8/WebM)
 * @param durationMs  durasi target output (dikunci ke countdown)
 * @throws bila bukan lingkungan Electron atau ffmpeg gagal
 */
export async function transcodeToMp4(webmBlob: Blob, durationMs: number): Promise<Blob> {
  if (!isElectron()) {
    throw new Error(
      "Transcode MP4 hanya tersedia di aplikasi Electron (ffmpeg native tidak ada di browser).",
    );
  }

  const buffer = await webmBlob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const durationSec = durationMs > 0 ? durationMs / 1000 : 0;

  const result: Uint8Array = await (window as any).electronAPI.transcodeToMp4(
    bytes,
    durationSec,
  );

  if (!result || result.length === 0) {
    throw new Error("Transcode MP4 menghasilkan file kosong.");
  }

  // Uint8Array valid sebagai BlobPart saat runtime; cast untuk melewati kepedantan lib TS.
  return new Blob([result as unknown as BlobPart], { type: "video/mp4" });
}
