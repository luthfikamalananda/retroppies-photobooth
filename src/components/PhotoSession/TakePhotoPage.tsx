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

// ─── Resolusi PREVIEW (live webcam di layar) — ringan untuk performa ────────
const PREVIEW_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30, max: 60 },
};

// ─── Resolusi CAPTURE (saat ambil foto) — tinggi untuk hasil tajam ──────────
const CAPTURE_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 3840 },
  height: { ideal: 2160 },
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
  // Mengembalikan Promise yang resolve setelah onstop event terpanggil,
  // sehingga kita PASTI tahu kapan stream sudah bebas dari proses recording
  // sebelum melakukan applyConstraints (yang akan mengganggu stream aktif).
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

  // ── Helper: capture foto di resolusi tinggi, lalu kembalikan ke preview ──
  // PENTING: hanya dipanggil SETELAH recording benar-benar berhenti,
  // supaya applyConstraints tidak mengganggu MediaRecorder yang aktif.
  const captureHighRes = useCallback(async (): Promise<string | undefined> => {
    const videoEl = webcamRef.current?.video as HTMLVideoElement | undefined;
    const stream = videoEl?.srcObject as MediaStream | undefined;
    const track = stream?.getVideoTracks()[0];

    if (!track) {
      return webcamRef.current?.getScreenshot() ?? undefined;
    }

    try {
      await track.applyConstraints(CAPTURE_CONSTRAINTS);
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const settings = track.getSettings();
      const dataUrl = webcamRef.current?.getScreenshot({
        width: settings.width ?? 3840,
        height: settings.height ?? 2160,
      });

      return dataUrl ?? undefined;
    } catch (err) {
      console.error("Gagal apply high-res constraints, fallback ke preview res:", err);
      return webcamRef.current?.getScreenshot() ?? undefined;
    } finally {
      try {
        await track.applyConstraints(PREVIEW_CONSTRAINTS);
      } catch {
        // Diamkan — tidak fatal
      }
    }
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

          // timeslice 1000ms — paksa MediaRecorder flush chunk setiap 1 detik,
          // bukan menunggu sampai stop(). Ini PENTING untuk konsistensi durasi:
          // tanpa timeslice, beberapa browser/driver hanya nge-flush data
          // secara tidak teratur, yang bisa menyebabkan video terpotong
          // pendek kalau ada gangguan kecil di akhir proses recording.
          mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
              recordedChunksRef.current.push(event.data);
            }
          };

          mediaRecorderRef.current.start(1000); // ← timeslice 1000ms
        }
      } catch (error) {
        console.error("Failed to start recording:", error);
      }
    }

    if (countdown === 0) {
      // ── Urutan WAJIB berurutan, bukan bersamaan ──────────────────────────
      // 1. Stop recording DULU dan tunggu sampai benar-benar selesai
      // 2. SETELAH ITU baru capture foto high-res (applyConstraints aman
      //    dilakukan karena stream sudah tidak sedang direkam)
      (async () => {
        const videoBlob = await stopRecordingAndWait();

        if (videoBlob && videoBlob.size > 0) {
          addVideoCapture({ slotIndex: nextSlot, videoBlob, recordedAt: Date.now() });
        }

        const dataUrl = await captureHighRes();
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
  }, [countdown, stopRecordingAndWait, captureHighRes, addVideoCapture, addCapture, nextSlot]);

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
              screenshotQuality={0.95}
              videoConstraints={PREVIEW_CONSTRAINTS}
              className="w-full h-full object-cover"
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

      <VideoPreviewModal type="capture" />
    </motion.div>
  );
}