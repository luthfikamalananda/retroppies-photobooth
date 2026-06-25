import { useRef, useCallback, useEffect, useState, memo } from "react";
import Webcam from "react-webcam";
import { AnimatePresence, motion } from "framer-motion";
import { useSessionStore } from "@/store/sessionStore";
import { usePhotoStore } from "@/store/photoStore";
import { useUIStore } from "@/store/uiStore";
import {
  btnNextBlack,
  btnNextWhite,
  iconNoImage,
  iconPhoto,
  logoBack,
} from "@/assets";
import { VideoPreviewModal } from "./VideoPreviewModal";
import { countDownPhoto } from "@/const/timers";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_SLOTS = 4;
const COUNTDOWN_DURATION = countDownPhoto;

const PREVIEW_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30, max: 30 },
};

const CAPTURE_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 3840 },
  height: { ideal: 2160 },
};

const RECORD_WIDTH = 960;
const RECORD_HEIGHT = 540;

// ─── CountdownDisplay ─────────────────────────────────────────────────────────

const CountdownDisplay = memo(function CountdownDisplay({
  countdown,
}: {
  countdown: number | null;
}) {
  if (countdown === null || countdown === 0) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={`cd-${countdown}`}
          className="text-9xl font-gaming text-white"
          style={{ textShadow: "0 4px 24px rgba(0,0,0,0.6)" }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {countdown}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

// ─── PoseOverlay ─────────────────────────────────────────────────────────────

const PoseOverlay = memo(function PoseOverlay({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="absolute inset-0 bg-black/30" />
          <motion.p
            className="relative font-gaming z-10"
            style={{
              fontSize: "clamp(64px, 14vw, 160px)",
              textShadow: "0 4px 32px rgba(0,0,0,0.8), 0 0 60px rgba(247,204,64,0.6)",
              letterSpacing: "0.15em",
              color: "#F7CC40",
            }}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, delay: 0.05 }}
          >
            POSE!
          </motion.p>
          <motion.p
            className="relative font-gaming text-white/80 z-10 text-2xl mt-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.2 }}
          >
            Taking photo...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ─── TakePhotoPage ────────────────────────────────────────────────────────────

export function TakePhotoPage() {
  const { goNext, goBack } = useSessionStore();
  const {
    captures, capturesVideo,
    addCapture, addVideoCapture,
    retakeSlot, retakeVideoSlot,
  } = usePhotoStore();

  const webcamRef = useRef<Webcam>(null);
  const setBg = useUIStore((s) => s.setBackgroundVariant);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [showPose, setShowPose] = useState(false);

  // Recording refs
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // ── FIX: flag untuk pause drawFrame saat captureHighRes berjalan ──────────
  // Root cause blackscreen foto pertama:
  // drawFrame loop terus menulis ke canvas offscreen saat applyConstraints
  // dipanggil. Selama transisi resolusi webcam (100–500ms), videoEl bisa
  // mengembalikan frame corrupt/blank. Flag ini meng-pause loop sementara.
  const isPausingDrawRef = useRef(false);

  const nextSlot =
    Array.from({ length: TOTAL_SLOTS }, (_, i) => i).find(
      (i) => !captures.find((c) => c.slotIndex === i)
    ) ?? -1;

  useEffect(() => {
    setBg("image-white");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    };
  }, []);

  // ── startRecording ────────────────────────────────────────────────────────

  const startRecording = useCallback((slotIdx: number) => {
    const videoEl = webcamRef.current?.video as HTMLVideoElement | null;
    if (!videoEl) return;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement("canvas");
    }
    const canvas = offscreenCanvasRef.current;
    canvas.width = RECORD_WIDTH;
    canvas.height = RECORD_HEIGHT;
    const ctx = canvas.getContext("2d", { willReadFrequently: false })!;

    const drawFrame = () => {
      if (recorderRef.current?.state !== "recording") return;

      // ── FIX: skip frame saat captureHighRes sedang applyConstraints ───────
      // Tanpa ini: drawImage saat transisi resolusi bisa menghasilkan
      // frame hitam yang "mengkontaminasi" canvas offscreen, yang kemudian
      // ikut ter-screenshot oleh getScreenshot() dari react-webcam internal.
      if (!isPausingDrawRef.current) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(videoEl, -RECORD_WIDTH, 0, RECORD_WIDTH, RECORD_HEIGHT);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    const mimeType =
      MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "video/mp4";

    chunksRef.current = [];

    try {
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 1_500_000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size > 0) {
          addVideoCapture({ slotIndex: slotIdx, videoBlob: blob, recordedAt: Date.now() });
        }
        chunksRef.current = [];
      };

      recorderRef.current = recorder;
      recorder.start(1000);
      rafRef.current = requestAnimationFrame(drawFrame);

      stopTimeoutRef.current = setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, COUNTDOWN_DURATION * 1000);

    } catch (err) {
      console.error("Gagal mulai recording:", err);
    }
  }, [addVideoCapture]);

  // ── captureHighRes ────────────────────────────────────────────────────────

  const captureHighRes = useCallback(async (): Promise<string | undefined> => {
    const videoEl = webcamRef.current?.video as HTMLVideoElement | null;
    const stream = videoEl?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks()[0];

    if (!track || !videoEl) {
      return webcamRef.current?.getScreenshot() ?? undefined;
    }

    // ── FIX: pause drawFrame SEBELUM applyConstraints ─────────────────────
    // Ini mencegah frame corrupt dari canvas offscreen selama transisi resolusi.
    isPausingDrawRef.current = true;

    const origW = videoEl.videoWidth;
    const origH = videoEl.videoHeight;

    try {
      await track.applyConstraints(CAPTURE_CONSTRAINTS);

      // Poll sampai resolusi benar-benar berubah (max 2 detik)
      // Perpanjang timeout dari 1.5s → 2s untuk kamera lambat
      const deadline = Date.now() + 2000;
      while (videoEl.videoWidth === origW && videoEl.videoHeight === origH) {
        if (Date.now() > deadline) {
          console.warn("Timeout resolusi tidak berubah, capture dengan resolusi saat ini");
          break;
        }
        await new Promise((r) => setTimeout(r, 30));
      }

      // ── FIX: tunggu LEBIH BANYAK frame setelah resolusi berubah ──────────
      // 2 frame (kode lama) tidak cukup untuk kamera/driver yang lambat.
      // Buffer video bisa masih berisi frame lama walau resolusi sudah berubah.
      // 4 frame (≈133ms @ 30fps) lebih aman untuk memastikan pixel data
      // yang masuk ke buffer webcam benar-benar dari resolusi baru.
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      // ── FIX: validasi frame tidak hitam sebelum screenshot ────────────────
      // Buat canvas sementara untuk sample pixel tengah.
      // Jika rata-rata brightness < 10 (dari 0–255), frame masih blackframe
      // → tunggu tambahan beberapa frame lagi.
      const sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = 16;
      sampleCanvas.height = 16;
      const sampleCtx = sampleCanvas.getContext("2d")!;

      let attempts = 0;
      while (attempts < 10) {
        sampleCtx.drawImage(videoEl, 0, 0, 16, 16);
        const data = sampleCtx.getImageData(0, 0, 16, 16).data;
        // Hitung rata-rata brightness (R+G+B / 3 per pixel, lalu rata-rata semua pixel)
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
          sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        const avgBrightness = sum / (data.length / 4);

        if (avgBrightness > 10) break; // Frame tidak hitam, aman untuk screenshot

        // Frame masih hitam — tunggu 2 frame lagi
        await new Promise((r) => requestAnimationFrame(r));
        await new Promise((r) => requestAnimationFrame(r));
        attempts++;
      }

      return webcamRef.current?.getScreenshot({
        width: videoEl.videoWidth || 3840,
        height: videoEl.videoHeight || 2160,
      }) ?? undefined;

    } catch (err) {
      console.error("High-res capture gagal, fallback ke preview res:", err);
      return webcamRef.current?.getScreenshot() ?? undefined;
    } finally {
      // Kembalikan ke preview resolution
      await track.applyConstraints(PREVIEW_CONSTRAINTS).catch(() => { });

      // ── FIX: resume drawFrame SETELAH applyConstraints preview selesai ───
      // Tunggu 2 frame setelah kembali ke preview agar canvas offscreen
      // tidak langsung mendapat frame glitch dari transisi balik.
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));
      isPausingDrawRef.current = false;
    }
  }, []);

  // ── startCountdown ────────────────────────────────────────────────────────

  const startCountdown = useCallback((slotIdx: number) => {
    if (slotIdx === -1 || countdown !== null) return;

    if (countdownRef.current) clearInterval(countdownRef.current);

    setCountdown(COUNTDOWN_DURATION);
    setShowPose(false);
    startRecording(slotIdx);

    let tick = COUNTDOWN_DURATION;

    countdownRef.current = setInterval(() => {
      tick -= 1;
      setCountdown(tick);

      if (tick === 0) {
        clearInterval(countdownRef.current!);
        countdownRef.current = null;

        setShowPose(true);

        captureHighRes().then((dataUrl) => {
          if (dataUrl) {
            addCapture({ slotIndex: slotIdx, dataUrl, capturedAt: Date.now() });
          }
          setShowPose(false);
          setCountdown(null);
        });
      }
    }, 1000);
  }, [countdown, startRecording, captureHighRes, addCapture]);

  const handleCapture = useCallback(() => {
    if (nextSlot === -1 || countdown !== null) return;
    startCountdown(nextSlot);
  }, [nextSlot, countdown, startCountdown]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-12 px-14 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex flex-row w-full justify-between items-center flex-shrink-0 invisible pb-4">
        <img src={logoBack} alt="Back" onClick={goBack}
          className="touch-target w-28 h-max select-none cursor-pointer" draggable={false} />
        <div className="w-28" />
      </div>

      <div className="flex-1 flex flex-row items-center justify-center w-full min-h-0 gap-20 px-20">
        {/* Webcam */}
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

            {nextSlot !== -1 && countdown === null && !showPose && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <button
                  className="touch-target w-20 h-20 rounded-full bg-white border-2 border-[#B23E3E] shadow-lg active:scale-95 transition-transform flex items-center justify-center"
                  onClick={handleCapture}
                >
                  <img src={iconPhoto} alt="Capture" className="w-12 h-12" />
                </button>
              </div>
            )}

            <CountdownDisplay countdown={countdown} />
            <PoseOverlay visible={showPose} />
          </div>
        </div>

        {/* Slot grid */}
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
                      <img src={photo.dataUrl} alt={`Slot ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        className="absolute left-1/2 -translate-x-1/2 bottom-3 w-12 h-12 bg-white text-black rounded-full text-3xl flex items-center justify-center"
                        onClick={() => { retakeSlot(i); retakeVideoSlot(i); }}
                        title="Retake"
                      >↺</button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#F8E6E6]/90">
                      <img src={iconNoImage} alt={`Empty Slot ${i + 1}`} className="w-[70%] h-[70%]" />
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
              key="NEXT"
              src={captures.length === TOTAL_SLOTS ? btnNextBlack : btnNextWhite}
              alt="NEXT"
              whileTap={{ scale: 0.95 }}
              onClick={() => { if (captures.length === TOTAL_SLOTS) goNext(); }}
              className="touch-target w-48 h-max select-none cursor-pointer"
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