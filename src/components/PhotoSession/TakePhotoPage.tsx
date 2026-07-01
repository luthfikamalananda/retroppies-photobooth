import { useRef, useCallback, useEffect, useState, memo } from "react";
import Webcam from "react-webcam";
import { AnimatePresence, motion } from "framer-motion";
import { useSessionStore } from "@/store/sessionStore";
import { usePhotoStore } from "@/store/photoStore";
import { useUIStore } from "@/store/uiStore";
import {
  btnBackGold,
  btnNextBlack,
  btnNextWhite,
  iconNoImage,
  iconPhoto,
  logoBack,
} from "@/assets";
import { VideoPreviewModal } from "./VideoPreviewModal";

const TOTAL_SLOTS = 4;
const COUNTDOWN_DURATION = 6;

// ─────────────────────────────────────────────────────────────────────────
// PERUBAHAN ARSITEKTUR PENTING — dibaca dulu sebelum lanjut:
//
// SEBELUMNYA: stream dimulai di resolusi rendah (1280x720) untuk preview
// ringan, lalu applyConstraints() dipanggil dinamis ke 4K saat capture,
// kemudian dikembalikan lagi ke 720p.
//
// MASALAH: applyConstraints() pada track yang AKTIF (apalagi sedang
// direkam MediaRecorder) adalah operasi yang DIKENAL menyebabkan hang/
// freeze di Chromium — ini bukan bug di kode kita, tapi limitasi browser
// engine itu sendiri (dikonfirmasi via Chromium issue tracker). Webcam
// hardware butuh waktu re-negotiate, dan selama proses itu video element
// bisa freeze/blackscreen, MediaRecorder bisa kehilangan frame, dsb.
//
// SOLUSI (mengikuti best practice photobooth-app.org & project sejenis):
// JANGAN switch resolusi sama sekali. Pakai SATU resolusi stream yang
// stabil dari awal sampai akhir. Preview ditampilkan dalam ukuran kecil
// di layar (CSS object-fit: cover) — GPU compositor yang urus downscale
// VISUAL tanpa perlu decode ulang resolusi berbeda. Capture screenshot
// diambil dari stream yang SAMA, tidak ada applyConstraints sama sekali.
//
// Resolusi dipilih 1920x1080 sebagai kompromi: cukup tajam untuk hasil
// cetak foto, tapi tidak seberat 4K untuk decode terus-menerus di iGPU
// lemah seperti Intel HD 630. Kalau OptiPlex 3050 masih struggle di
// 1920x1080, turunkan ke 1280x720 (lihat STREAM_CONSTRAINTS di bawah).
// ─────────────────────────────────────────────────────────────────────────

const STREAM_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  frameRate: { ideal: 24, max: 30 }, // 24fps cukup smooth, lebih ringan dari 30fps
};

// ─── Isolated Countdown component ────────────────────────────────────────────
const CountdownDisplay = memo(function CountdownDisplay({
  countdown,
}: {
  countdown: number | null;
}) {
  if (countdown === null) return null;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-full text-sm overflow-hidden">
      <motion.div
        key={`key-${countdown}`}
        className="text-9xl font-gaming text-[#FFFFFF]"
        style={{ textShadow: "0 4px 12px rgba(0,0,0,0.5)" }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.2, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {countdown}
      </motion.div>
    </div>
  );
});

export function TakePhotoPage() {
  const { goNext, goBack } = useSessionStore();
  const {
    captures,
    capturesVideo,
    addCapture,
    addVideoCapture,
    retakeSlot,
    retakeVideoSlot,
    clearPhotos,
  } = usePhotoStore();
  const webcamRef = useRef<Webcam>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const setBg = useUIStore((s) => s.setBackgroundVariant);

  const nextSlot =
    Array.from({ length: TOTAL_SLOTS }, (_, i) => i).find(
      (i) => !captures.find((c) => c.slotIndex === i),
    ) ?? -1;

  useEffect(() => {
    setBg("image-white");
  }, []);

  // ── Helper: stop MediaRecorder dan tunggu sampai benar-benar selesai ──────
  const stopRecordingAndWait = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;

      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const videoBlob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });
        recordedChunksRef.current = [];
        resolve(videoBlob);
      };

      recorder.stop();
    });
  }, []);

  // ── Helper: capture foto — SEKARANG TANPA applyConstraints ───────────────
  // Karena stream sudah berjalan di resolusi STREAM_CONSTRAINTS sejak awal
  // (sama untuk preview maupun capture), fungsi ini jadi jauh lebih simpel
  // dan tidak ada lagi race condition / freeze risk dari resolution switch.
  const capturePhoto = useCallback((): string | undefined => {
    return webcamRef.current?.getScreenshot() ?? undefined;
  }, []);

  // Countdown timer effect with video recording
  useEffect(() => {
    if (countdown === null) return;

    if (countdown === COUNTDOWN_DURATION) {
      recordedChunksRef.current = [];
      try {
        const stream = (webcamRef.current?.video as any)?.srcObject as MediaStream;
        if (stream) {
          const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
            ? "video/webm;codecs=vp9"
            : MediaRecorder.isTypeSupported("video/webm")
              ? "video/webm"
              : "video/mp4";

          mediaRecorderRef.current = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 2_500_000,
          });

          mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
              recordedChunksRef.current.push(event.data);
            }
          };

          mediaRecorderRef.current.start(1000); // timeslice 1s untuk flush konsisten
        }
      } catch (error) {
        console.error("Failed to start recording:", error);
      }
    }

    if (countdown === 0) {
      (async () => {
        const videoBlob = await stopRecordingAndWait();

        if (videoBlob && videoBlob.size > 0) {
          addVideoCapture({ slotIndex: nextSlot, videoBlob, recordedAt: Date.now() });
        }

        // Capture langsung tanpa delay/race — stream tidak pernah berubah
        // resolusi, jadi tidak perlu menunggu re-negotiate apapun.
        const dataUrl = capturePhoto();
        if (dataUrl) {
          addCapture({ slotIndex: nextSlot, dataUrl, capturedAt: Date.now() });
        }
      })();

      setCountdown(null);
      return;
    }

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [countdown, stopRecordingAndWait, capturePhoto, addVideoCapture, addCapture, nextSlot]);

  const capture = useCallback(() => {
    if (nextSlot === -1 || countdown !== null) return;
    setCountdown(COUNTDOWN_DURATION);
  }, [nextSlot, countdown]);

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-12 px-14 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* ── Header row ── */}
      <div className="flex flex-row w-full justify-between items-center flex-shrink-0 invisible pb-4">
        <img
          src={logoBack}
          alt="Back"
          onClick={goBack}
          className="touch-target w-28 h-max select-none cursor-pointer"
          draggable={false}
        />
        <div className="w-28" />
      </div>

      <div className="flex-1 flex flex-row items-center justify-center w-full min-h-0 gap-20 px-20">
        {/* Webcam Preview */}
        <div className="flex w-full h-full justify-center items-center">
          <div className="w-full h-full relative rounded-2xl overflow-hidden border-2 border-[#B23E3E]">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.92}
              videoConstraints={STREAM_CONSTRAINTS} // ← SATU constraint, tidak pernah berubah
              className="w-full h-full object-cover" // ← downscale VISUAL via CSS, bukan decode ulang
              mirrored
            />

            {nextSlot !== -1 && countdown === null && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm overflow-hidden">
                <button
                  className="touch-target w-20 h-20 rounded-full bg-white border-2 border-[#B23E3E] shadow-lg active:scale-95 transition-transform disabled:opacity-30 overflow-hidden flex items-center justify-center"
                  onClick={capture}
                >
                  <img src={iconPhoto} alt="Capture" className="w-12 h-12" />
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              <CountdownDisplay countdown={countdown} />
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col gap-6 w-full h-full justify-center items-center">
          <div className="grid grid-cols-2 gap-8 w-full h-full">
            {Array.from({ length: TOTAL_SLOTS }, (_, i) => {
              const photo = captures.find((c) => c.slotIndex === i);
              return (
                <div
                  key={i}
                  className="relative aspect-square bg-black/40 border-2 border-[#B23E3E] rounded-lg overflow-hidden h-full w-full"
                >
                  {photo ? (
                    <>
                      <img
                        src={photo.dataUrl}
                        alt={`Slot ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        className="absolute left-1/2 -translate-x-1/2 bottom-3 w-12 h-12 bg-[#FFFFFF] text-[#000000] rounded-full text-3xl flex items-center justify-center"
                        onClick={() => {
                          retakeSlot(i);
                          retakeVideoSlot(i);
                        }}
                        title="Retake"
                      >
                        ↺
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-body bg-[#F8E6E6]/90">
                      <img
                        src={iconNoImage}
                        alt={`Empty Slot ${i + 1}`}
                        className="w-[70%] h-[70%]"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-row w-full justify-end items-center flex-shrink-0">
        <AnimatePresence>
          {captures.length === TOTAL_SLOTS && (
            <motion.img
              key={"NEXT"}
              src={captures.length === TOTAL_SLOTS ? btnNextBlack : btnNextWhite}
              alt="NEXT"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (captures.length === TOTAL_SLOTS) {
                  goNext();
                }
              }}
              className="touch-target w-48 h-max select-none cursor-pointer transition-all"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              draggable={false}
            />
          )}
        </AnimatePresence>
      </div>

      {/* <VideoPreviewModal type="capture" /> */}
    </motion.div>
  );
}