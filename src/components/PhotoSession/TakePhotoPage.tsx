/**
 * TakePhotoPage — optimized for low-spec MiniPC
 *
 * Perubahan arsitektur utama:
 *
 * 1. RECORDING DIPISAH KE CANVAS OFFSCREEN
 *    Dulu: MediaRecorder merekam langsung dari webcam stream (live preview track).
 *    Sekarang: ada canvas offscreen kecil (960×540) khusus untuk recording.
 *    - Preview webcam tetap jalan normal tanpa interferensi dari recorder
 *    - Encoder video hanya handle resolusi kecil → tidak patah-patah di MiniPC
 *    - applyConstraints untuk high-res TIDAK menyentuh recording track sama sekali
 *
 * 2. DURASI RECORDING DIJAMIN DENGAN TIMER FIXED
 *    Dulu: recording berhenti saat countdown === 0 di useEffect.
 *    Sekarang: recorder.stop() dipanggil via setTimeout(COUNTDOWN_DURATION * 1000)
 *    sejak start recording — durasi selalu konsisten, tidak bergantung timing React.
 *
 * 3. FOTO DAN VIDEO DIPROSES PARALEL (sebisa mungkin)
 *    Dulu: stopRecordingAndWait() → captureHighRes() sequential.
 *    Sekarang: stopRecording() dipanggil dulu, lalu captureHighRes() langsung
 *    jalan karena track recording TERPISAH dari track preview — tidak perlu
 *    tunggu recording selesai untuk applyConstraints.
 *    onstop callback handle simpan blob secara async.
 *
 * 4. POSE SCREEN saat countdown === 0
 *    Full-screen overlay "POSE" muncul segera saat countdown hit 0,
 *    sebelum proses foto selesai — user tidak lihat blank screen.
 *
 * 5. STRICT MODE SAFE
 *    useRef untuk semua state recording (recorder, chunks, stopTimeout)
 *    — tidak ada race condition dari double-invoke useEffect.
 */

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
const COUNTDOWN_DURATION = countDownPhoto;           // detik — harus sama dengan timer store

// Resolusi PREVIEW — ringan agar preview smooth di MiniPC
const PREVIEW_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30, max: 30 },   // cap 30fps — kurangi beban GPU
};

// Resolusi CAPTURE — tinggi untuk print quality
const CAPTURE_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 3840 },
  height: { ideal: 2160 },
};

// Resolusi canvas offscreen untuk recording video
// Sengaja LEBIH KECIL dari preview — tujuannya hanya buat GIF/video sosmed
// bukan untuk print. MiniPC tidak perlu encode 1280×720 real-time.
const RECORD_WIDTH = 960;
const RECORD_HEIGHT = 540;

// ─── Countdown display ────────────────────────────────────────────────────────

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

// ─── POSE overlay — muncul saat countdown hit 0 ──────────────────────────────

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
          {/* Semi-transparent overlay */}
          <div className="absolute inset-0 bg-black/30" />

          {/* POSE text */}
          <motion.p
            className="relative font-gaming text-white z-10"
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

          {/* Subtitle */}
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

  // Countdown & pose state
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showPose, setShowPose] = useState(false);

  // Recording refs — tidak trigger re-render, strict mode safe
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // nextSlot yang belum terisi
  const nextSlot =
    Array.from({ length: TOTAL_SLOTS }, (_, i) => i).find(
      (i) => !captures.find((c) => c.slotIndex === i)
    ) ?? -1;

  useEffect(() => {
    setBg("image-white");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup saat unmount ──────────────────────────────────────────────────
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

  // ── Mulai recording ke canvas offscreen ──────────────────────────────────
  // Menggunakan canvas offscreen kecil (RECORD_WIDTH × RECORD_HEIGHT) agar
  // encoder video tidak membebani GPU MiniPC.
  // Canvas ini di-feed frame dari <video> element via requestAnimationFrame loop.
  const startRecording = useCallback((slotIdx: number) => {
    const videoEl = webcamRef.current?.video as HTMLVideoElement | null;
    if (!videoEl) return;

    // Buat/reuse canvas offscreen
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement("canvas");
    }
    const canvas = offscreenCanvasRef.current;
    canvas.width = RECORD_WIDTH;
    canvas.height = RECORD_HEIGHT;
    const ctx = canvas.getContext("2d", { willReadFrequently: false })!;

    // Render loop: copy frame dari webcam ke canvas offscreen
    const drawFrame = () => {
      if (recorderRef.current?.state === "recording") {
        ctx.save();
        // Mirror horizontal (sesuai preview)
        ctx.scale(-1, 1);
        ctx.drawImage(videoEl, -RECORD_WIDTH, 0, RECORD_WIDTH, RECORD_HEIGHT);
        ctx.restore();
        rafRef.current = requestAnimationFrame(drawFrame);
      }
    };

    // Pilih mimeType terbaik yang tersedia
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
        videoBitsPerSecond: 1_500_000,  // 1.5Mbps — cukup untuk 960×540, ringan di CPU
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
      recorder.start(1000); // timeslice 1s — flush data reguler

      // Mulai render loop SETELAH recorder.start()
      rafRef.current = requestAnimationFrame(drawFrame);

      // Stop recording setelah durasi FIXED — tidak bergantung countdown React
      // Ini yang menjamin durasi video selalu = COUNTDOWN_DURATION detik
      stopTimeoutRef.current = setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, COUNTDOWN_DURATION * 1000);

    } catch (err) {
      console.error("Gagal mulai recording:", err);
    }
  }, [addVideoCapture]);

  // ── Capture foto high-res ─────────────────────────────────────────────────
  // Dipanggil SETELAH recording stop karena sekarang recording pakai
  // canvas offscreen stream, bukan webcam track langsung — jadi
  // applyConstraints ke webcam aman dilakukan kapan saja.
  const captureHighRes = useCallback(async (): Promise<string | undefined> => {
    const videoEl = webcamRef.current?.video as HTMLVideoElement | null;
    const stream = videoEl?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks()[0];

    if (!track || !videoEl) {
      return webcamRef.current?.getScreenshot() ?? undefined;
    }

    const origW = videoEl.videoWidth;
    const origH = videoEl.videoHeight;

    try {
      await track.applyConstraints(CAPTURE_CONSTRAINTS);

      // Poll sampai resolusi benar-benar berubah (max 1.5 detik)
      const deadline = Date.now() + 1500;
      while (videoEl.videoWidth === origW && videoEl.videoHeight === origH) {
        if (Date.now() > deadline) break;
        await new Promise((r) => setTimeout(r, 30));
      }

      // Tunggu 2 frame extra setelah resolusi berubah
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      return webcamRef.current?.getScreenshot({
        width: videoEl.videoWidth || 3840,
        height: videoEl.videoHeight || 2160,
      }) ?? undefined;

    } catch (err) {
      console.error("High-res capture gagal, fallback ke preview res:", err);
      return webcamRef.current?.getScreenshot() ?? undefined;
    } finally {
      // Kembalikan ke resolusi preview setelah capture
      track.applyConstraints(PREVIEW_CONSTRAINTS).catch(() => { });
    }
  }, []);

  // ── Mulai countdown ───────────────────────────────────────────────────────
  const startCountdown = useCallback((slotIdx: number) => {
    if (slotIdx === -1 || countdown !== null) return;

    // Clear state sebelumnya
    if (countdownRef.current) clearInterval(countdownRef.current);

    setCountdown(COUNTDOWN_DURATION);
    setShowPose(false);

    // Mulai recording langsung — tidak perlu tunggu React re-render
    startRecording(slotIdx);

    let tick = COUNTDOWN_DURATION;

    countdownRef.current = setInterval(() => {
      tick -= 1;
      setCountdown(tick);

      if (tick === 0) {
        clearInterval(countdownRef.current!);
        countdownRef.current = null;

        // Tampilkan POSE overlay segera
        setShowPose(true);

        // Capture foto — recording sudah jalan di track terpisah,
        // tidak perlu tunggu recording selesai untuk applyConstraints
        captureHighRes().then((dataUrl) => {
          if (dataUrl) {
            addCapture({ slotIndex: slotIdx, dataUrl, capturedAt: Date.now() });
          }
          // Sembunyikan POSE setelah foto selesai disimpan
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

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-12 px-14 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* ── Header ── */}
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
        {/* ── Webcam Preview ── */}
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

            {/* Tombol capture — hanya tampil saat tidak countdown dan slot tersedia */}
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

            {/* Countdown overlay */}
            <CountdownDisplay countdown={countdown} />

            {/* POSE overlay — muncul saat countdown hit 0 */}
            <PoseOverlay visible={showPose} />
          </div>
        </div>

        {/* ── Right Panel: foto slots ── */}
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
                        className="absolute left-1/2 -translate-x-1/2 bottom-3 w-12 h-12 bg-white text-black rounded-full text-3xl flex items-center justify-center"
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
                    <div className="w-full h-full flex items-center justify-center bg-[#F8E6E6]/90">
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

      {/* ── Footer ── */}
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