import { useRef, useCallback, useEffect, useState, memo } from "react";
import Webcam from "react-webcam";
import { AnimatePresence, motion } from "framer-motion";
import { useSessionStore } from "@/store/sessionStore";
import { usePhotoStore } from "@/store/photoStore";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { useTemplateStore } from "@/store/templateStore";
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

const STATIC_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  frameRate: { ideal: 30, max: 30 },
};

const CAPTURE_WIDTH = 1920;
const CAPTURE_HEIGHT = 1080;
const RECORD_VIDEO_BITS_PER_SECOND = 1_200_000;

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
  const user = useAuthStore((s) => s.user);
  const ensureTemplatesLoaded = useTemplateStore((s) => s.ensureTemplatesLoaded);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [showPose, setShowPose] = useState(false);

  // Recording refs
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimeoutRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const isCapturingRef = useRef(false);
  const isMountedRef = useRef(true);

  const nextSlot =
    Array.from({ length: TOTAL_SLOTS }, (_, i) => i).find(
      (i) => !captures.find((c) => c.slotIndex === i)
    ) ?? -1;

  useEffect(() => {
    setBg("image-white");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Prefetch templat + hangatkan semua gambar displayUrl selagi user
  // mengambil foto, sehingga TemplatePage (halaman berikutnya) tampil
  // instan. Idempoten — hanya fetch sekali per tenant.
  useEffect(() => {
    if (user) ensureTemplatesLoaded(user.tenantId);
  }, [user, ensureTemplatesLoaded]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    };
  }, []);

  const captureStillFrame = useCallback(async (): Promise<string | undefined> => {
    const videoEl = webcamRef.current?.video as HTMLVideoElement | null;

    if (!videoEl) {
      return webcamRef.current?.getScreenshot() ?? undefined;
    }

    const width = videoEl.videoWidth || CAPTURE_WIDTH;
    const height = videoEl.videoHeight || CAPTURE_HEIGHT;

    return webcamRef.current?.getScreenshot({ width, height }) ?? undefined;
  }, []);

  const startRecording = useCallback((slotIdx: number) => {
    const videoEl = webcamRef.current?.video as HTMLVideoElement | null;
    if (!videoEl || isCapturingRef.current) return;

    const mimeType =
      MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "video/mp4";

    chunksRef.current = [];
    isCapturingRef.current = true;

    try {
      const stream =
        (videoEl as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream?.() ??
        new MediaStream();
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: RECORD_VIDEO_BITS_PER_SECOND,
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (!isMountedRef.current) return;

        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size > 0) {
          addVideoCapture({ slotIndex: slotIdx, videoBlob: blob, recordedAt: Date.now() });
        }
        chunksRef.current = [];
        recorderRef.current = null;
      };

      recorderRef.current = recorder;
      recorder.start(1000);

      stopTimeoutRef.current = window.setTimeout(() => {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      }, COUNTDOWN_DURATION * 1000);
    } catch (error) {
      console.error("Gagal mulai recording:", error);
      isCapturingRef.current = false;
    }
  }, [addVideoCapture]);

  const finalizeCapture = useCallback(async (slotIdx: number) => {
    if (!isMountedRef.current) return;

    const dataUrl = await captureStillFrame();
    if (dataUrl) {
      addCapture({ slotIndex: slotIdx, dataUrl, capturedAt: Date.now() });
    }

    setShowPose(false);
    setCountdown(null);
    isCapturingRef.current = false;
  }, [addCapture, captureStillFrame]);

  const startCountdown = useCallback((slotIdx: number) => {
    if (slotIdx === -1 || countdown !== null || isCapturingRef.current) return;

    if (countdownRef.current) clearInterval(countdownRef.current);
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);

    const deadlineAt = Date.now() + COUNTDOWN_DURATION * 1000;

    setCountdown(COUNTDOWN_DURATION);
    setShowPose(false);
    startRecording(slotIdx);

    countdownRef.current = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
      setCountdown(remaining);

      if (remaining === 0) {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }

        if (stopTimeoutRef.current) {
          clearTimeout(stopTimeoutRef.current);
          stopTimeoutRef.current = null;
        }

        setShowPose(true);

        if (recorderRef.current && recorderRef.current.state !== "inactive") {
          recorderRef.current.stop();
        }

        void finalizeCapture(slotIdx);
      }
    }, 1000);
  }, [countdown, startRecording, finalizeCapture]);

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
              videoConstraints={STATIC_VIDEO_CONSTRAINTS}
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