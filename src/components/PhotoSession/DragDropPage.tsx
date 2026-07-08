import { btnNextBlack, logoBack, logoChooseFilter, logoDragAndDrop, logoWindowControl } from "@/assets";
import { getLayoutDef } from "@/config/layouts.config";
import { applyColorGrade, COLOR_GRADE_PRESETS, type ColorGradeOptions } from "@/services/colorGrading";
import { createSessions } from "@/services/finalizeService";
import { printPhotoBorderless } from '@/services/printService';
import { useAuthStore } from "@/store/authStore";
import { CapturedPhoto, usePhotoStore } from "@/store/photoStore";
import { useSessionStore } from "@/store/sessionStore";
import { useUIStore } from "@/store/uiStore";
import type { SlotDef } from "@/types/layout";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { VideoPreviewModal } from "./VideoPreviewModal";
import { countDownPhoto } from "@/const/timers";
import fixWebmDuration from "fix-webm-duration";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlotState {
  slotDef: SlotDef;
  photo: CapturedPhoto | null;
}

type FilterId =
  | 'original'
  | 'kodakVintage'
  | 'noirFilm'
  | 'digicam2000s'
  | '80sRetro'
  | 'dramaticBW'
  | 'dreamyVintage'

interface Filter {
  id: FilterId
  label: string
  grade?: ColorGradeOptions
}

const FILTERS: Array<Filter> = [
  { id: 'original', label: 'Original', grade: undefined },
  { id: 'kodakVintage', label: 'Kodak Vintage', grade: COLOR_GRADE_PRESETS.kodakVintage },
  { id: 'noirFilm', label: 'Noir Film', grade: COLOR_GRADE_PRESETS.noirFilm },
  { id: 'digicam2000s', label: 'Digicam 2000s', grade: COLOR_GRADE_PRESETS.digicam2000s },
  { id: '80sRetro', label: '80s Retro', grade: COLOR_GRADE_PRESETS['80sRetro'] },
  { id: 'dramaticBW', label: 'Dramatic B&W', grade: COLOR_GRADE_PRESETS.dramaticBW },
  { id: 'dreamyVintage', label: 'Dreamy Vintage', grade: COLOR_GRADE_PRESETS.dreamyVintage },
]

// ─── Helper: render foto + color grade ke sebuah <canvas> ────────────────────
//
// PENTING untuk mini PC low-end (Dell OptiPlex 3050, Intel HD 630):
//
// 1. DOWNSCALE sebelum grading — applyColorGrade berjalan O(width × height).
//    Foto asli webcam bisa 3000-4000px lebar. Untuk thumbnail yang cuma
//    ditampilkan ~150-300px, grading di resolusi PENUH itu costly besar
//    tanpa manfaat visual tambahan. Downscale ke MAX_THUMB_SIZE SEBELUM
//    applyColorGrade membuat operasi puluhan kali lebih cepat.
//
// 2. STAGGERED RENDERING via renderDelay — masalah utama transisi ke
//    halaman filter: SelectFilterTray me-render 7 filter SEKALIGUS, dan
//    karena semuanya langsung terlihat di grid (tidak perlu scroll),
//    pendekatan lazy-load berbasis IntersectionObserver TIDAK membantu —
//    observer langsung fire untuk ke-7 elemen di frame yang sama, persis
//    seperti tidak lazy sama sekali. Solusinya: beri setiap thumbnail
//    delay kecil bertingkat (renderDelay), sehingga applyColorGrade untuk
//    ke-7 filter tersebar di beberapa frame berbeda, bukan menumpuk di
//    satu frame yang menyebabkan main thread freeze sesaat.
const MAX_THUMB_SIZE = 280 // px, lebar maksimum sebelum grading dihitung

function GradedImage({
  src,
  grade,
  className,
  style,
  renderDelay = 0,
  fullRes = false,
}: {
  src: string
  grade: ColorGradeOptions | undefined
  className?: string
  style?: React.CSSProperties
  renderDelay?: number
  fullRes?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    setIsReady(false)

    const run = () => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        if (cancelled) return
        const canvas = canvasRef.current
        if (!canvas) return

        let targetW = img.naturalWidth
        let targetH = img.naturalHeight

        if (!fullRes && targetW > MAX_THUMB_SIZE) {
          const scale = MAX_THUMB_SIZE / targetW
          targetW = MAX_THUMB_SIZE
          targetH = Math.round(img.naturalHeight * scale)
        }

        canvas.width = targetW
        canvas.height = targetH
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(img, 0, 0, targetW, targetH)

        if (grade) {
          applyColorGrade(canvas, grade)
        }

        setIsReady(true)
      }
      img.src = src
    }

    if (renderDelay > 0) {
      timeoutId = setTimeout(run, renderDelay)
    } else {
      run()
    }

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [src, grade, renderDelay, fullRes])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        ...style,
        opacity: isReady ? 1 : 0,
        transition: 'opacity 0.15s ease-out',
      }}
    />
  )
}

// ─── Modal Ask Permission ───────────────────────────────────────────────────────────

interface AskPermissionModalProps {
  isOpen: boolean
  onAccept: () => void
  onDecline: () => void
}

function AskPermissionModal({ isOpen, onAccept, onDecline }: AskPermissionModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-xl border-4 border-[#F7CC40] shadow-2xl overflow-hidden w-[650px]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#F7CC40] px-5 py-4 flex items-center justify-between">
              <h2 className="font-gaming text-[#2C2C2C] text-3xl">ASK FOR PERMISSION</h2>
              <img src={logoWindowControl} alt="Window-Control" className="select-none pointer-events-none h-auto" />
            </div>

            <div className="bg-[#FCF8EF] px-8 py-8 flex flex-col gap-6">
              <p className="font-gaming text-[#2C2C2C] text-2xl py-2 text-center">
                Your photos look amazing! Would you allow us to feature them on @retroppies?
              </p>

              <div className="flex gap-4 justify-center mt-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onDecline}
                  className="flex-1 bg-[#BA371E] hover:bg-[#9A2C15] text-white font-gaming text-xl py-5 px-6 rounded-lg border-2 border-[#7A1E0A] transition-colors"
                >
                  No, Thanks!
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onAccept}
                  className="flex-1 bg-[#4CAF50] hover:bg-[#45a049] text-white font-gaming text-xl py-5 px-6 rounded-lg border-2 border-[#2E7D32] transition-colors"
                >
                  Yes, Sure!
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TemplateCompositeProps {
  templateUrl: string;
  slots: SlotState[];
  selectedSlotIndex: number | null;
  dragOverSlotIndex: number | null;
  onSlotClick: (index: number) => void;
  onClearSlot: (index: number) => void;
  pageState: 'dragdrop' | 'selectfilter';
  selectedFilter: Filter;
}

function TemplateComposite({
  templateUrl,
  slots,
  selectedSlotIndex,
  dragOverSlotIndex,
  onSlotClick,
  onClearSlot,
  pageState,
  selectedFilter
}: TemplateCompositeProps) {
  return (
    <div className="relative w-full h-full select-none">
      {slots.map(({ slotDef, photo }) => (
        <div
          key={slotDef.index}
          data-slot-index={slotDef.index}
          onClick={() => onSlotClick(slotDef.index)}
          style={{
            position: "absolute",
            left: `${slotDef.cx * 100}%`,
            top: `${slotDef.cy * 100}%`,
            width: `${slotDef.w * 100}%`,
            height: `${slotDef.h * 100}%`,
            transform: `translate(-50%, -50%) rotate(${slotDef.angle}deg)`,
            overflow: "hidden",
            cursor: "pointer",
          }}
          className="group relative"
        >
          {photo ? (
            <div className="relative w-full h-full">
              {/* fullRes=true — slot template adalah output utama, butuh
                  resolusi penuh untuk hasil akhir yang tajam, beda dengan
                  thumbnail filter tray yang cukup downscale. */}
              <GradedImage
                src={photo.dataUrl}
                grade={selectedFilter.grade}
                className="w-full h-full object-cover"
                fullRes
              />
              {pageState === 'dragdrop' &&
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearSlot(slotDef.index);
                  }}
                  className="absolute top-2 right-2 w-4 h-4 rounded-full bg-retro-brown/90 border border-retro-amber text-retro-amber flex items-center justify-center font-bold text-[10px] shadow-md hover:bg-retro-amber hover:text-retro-brown active:scale-95 transition-all duration-150 z-20 touch-target"
                >
                  ✕
                </button>
              }
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/30 group-hover:bg-retro-amber/10 transition-colors duration-200">
              <span className="font-gaming text-3xl mb-1">＋</span>
              <span className="font-gaming text-sm">
                Slot {slotDef.index + 1}
              </span>
            </div>
          )}

          {(selectedSlotIndex === slotDef.index || dragOverSlotIndex === slotDef.index) && (
            <div
              className={`absolute inset-0 border-4 ${dragOverSlotIndex === slotDef.index ? "border-retro-amber border-dashed animate-pulse" : "border-retro-amber"
                } pointer-events-none z-50`}
              style={{
                boxShadow: dragOverSlotIndex === slotDef.index
                  ? "inset 0 0 0 4px rgba(212,160,23,0.5), 0 0 15px rgba(212,160,23,0.7)"
                  : "inset 0 0 0 2px rgba(212,160,23,0.4)",
              }}
            />
          )}
        </div>
      ))}

      <img
        src={templateUrl}
        alt="Template overlay"
        draggable={false}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ objectFit: "fill" }}
      />
    </div>
  );
}

// ─── Photo Picker Tray ────────────────────────────────────────────────────────

interface PhotoTrayProps {
  captures: CapturedPhoto[];
  activeSlotIndex: number | null;
  onAssign: (slotIndex: number, dataUrl: string) => void;
  onDrag: (event: any, info: any) => void;
  onDragEnd: (photo: CapturedPhoto) => void;
}

function PhotoTray({ captures, activeSlotIndex, onAssign, onDrag, onDragEnd }: PhotoTrayProps) {
  const [draggingPhoto, setDraggingPhoto] = useState<CapturedPhoto | null>(null)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })

  return (
    <div className="flex flex-col h-full gap-2 justify-between items-center w-[50%] z-50">
      <motion.img
        src={logoDragAndDrop}
        alt="Drag and Drop"
        className="w-80 h-20 select-none pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        draggable={false}
      />
      <div className="grid grid-cols-2 gap-4 h-full w-full overflow-hidden">
        {captures.map((photo) => (
          <div
            key={photo.slotIndex}
            className={[
              "rounded-xl w-full overflow-hidden border-4  transition-all duration-200 flex-shrink-0 cursor-grab active:cursor-grabbing flex justify-center items-center",
              activeSlotIndex !== null
                ? "border-retro-amber/60 hover:border-retro-amber hover:scale-[1.02]"
                : "border-[#B23E3E] hover:border-retro-amber/40",
            ].join(" ")}
            onClick={() => {
              if (activeSlotIndex !== null) onAssign(activeSlotIndex, photo.dataUrl)
            }}
            onPointerDown={(e) => {
              setDraggingPhoto(photo)
              setDragPosition({ x: e.clientX, y: e.clientY })
            }}
          >
            <motion.div
              drag
              dragSnapToOrigin
              dragElastic={0.6}
              style={{ touchAction: 'none' }}
              onDrag={(event, info) => {
                setDragPosition({ x: info.point.x, y: info.point.y })
                onDrag(event, info)
              }}
              onDragStart={() => setDraggingPhoto(photo)}
              onDragEnd={() => {
                onDragEnd(photo)
                setDraggingPhoto(null)
              }}
              whileDrag={{ opacity: 0.3 }}
              className="w-full h-full aspect-square overflow-hidden"
            >
              <img
                src={photo.dataUrl}
                alt={`Foto ${photo.slotIndex + 1}`}
                className="w-full h-full object-cover pointer-events-none"
              />
            </motion.div>
          </div>
        ))}
      </div>

      {draggingPhoto && createPortal(
        <div
          className="fixed pointer-events-none z-[9999]"
          style={{
            left: dragPosition.x,
            top: dragPosition.y,
            transform: 'translate(-50%, -50%) rotate(2deg) scale(1.1)',
          }}
        >
          <img
            src={draggingPhoto.dataUrl}
            className="w-48 h-72 object-cover rounded-xl shadow-2xl opacity-90 border-2 border-retro-amber"
            draggable={false}
          />
        </div>,
        document.body
      )}
    </div>
  )
}

// ─── Select Filter Tray ────────────────────────────────────────────────────────
//
// Thumbnail di-render dengan STAGGERED DELAY (index * 60ms) — ini KUNCI
// fix performa di mini PC. Tanpa ini, mount SelectFilterTray langsung
// memicu 7x applyColorGrade (loop pixel) di frame yang sama, menyebabkan
// main thread freeze terasa sebagai "lag" saat transisi ke halaman filter.
//
// Dengan stagger 60ms, ke-7 filter selesai dalam ~420ms total, tapi
// TERSEBAR di beberapa frame berbeda — browser tetap bisa render UI
// lain (animasi transisi halaman, dsb) di antara setiap kalkulasi grading,
// alih-alih satu frame yang "stuck" mengerjakan semuanya sekaligus.
function SelectFilterTray({
  selectedFilter,
  setSelectedFilter,
}: {
  selectedFilter: Filter
  setSelectedFilter: (filter: Filter) => void
}) {
  const { captures } = usePhotoStore()
  const previewSrc = captures[0]?.dataUrl

  return (
    <div className="flex flex-col h-full gap-2 justify-between items-center w-[50%] z-50">
      <motion.img
        src={logoChooseFilter}
        alt="Drag and Drop"
        className="w-80 h-20 select-none pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        draggable={false}
      />
      <div className="grid grid-cols-2 gap-4 h-full w-full overflow-y-scroll bg-[#B23E3E] p-4 rounded-3xl">
        {FILTERS.map((filter, index) => (
          <div
            key={filter.id}
            className={[
              "rounded-xl w-full flex-col p-2 border-4  transition-transform duration-200 flex-shrink-0 cursor-pointer flex justify-center items-center",
              'border-[#B23E3E] hover:border-[#F8F8F8] hover:scale-[1.02]',
              selectedFilter.id == filter.id && 'border-[#F8F8F8]'
            ].join(" ")}
            onClick={() => setSelectedFilter(filter)}
          >
            {previewSrc && (
              <GradedImage
                src={previewSrc}
                grade={filter.grade}
                className="w-full h-72 object-cover pointer-events-none rounded-xl"
                renderDelay={index * 60}
              />
            )}
            <p className="text-center italic font-body text-lg font-bold text-[#F8F8F8] py-2">{filter.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DragDropPage() {
  const [pageState, setPageState] = useState<'dragdrop' | 'selectfilter'>('dragdrop')
  const [openModalPermission, setOpenModalPermission] = useState<boolean>(false)

  const [selectedFilter, setSelectedFilter] = useState<Filter>(FILTERS[0])

  const { goBack, continueToFinalization, transaction, autoSubmit } = useSessionStore();
  const { user } = useAuthStore()
  const { template, captures, capturesVideo, setTemplateAndGif } = usePhotoStore();

  const [slotMap, setSlotMap] = useState<Record<number, string>>({});
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);

  const layoutDef = template ? getLayoutDef(template.layoutId) : null;
  const slotCount = layoutDef?.slotCount ?? 1;

  const slots: SlotState[] = (layoutDef?.slots ?? []).map((slotDef) => ({
    slotDef,
    photo: slotMap[slotDef.index]
      ? { slotIndex: slotDef.index, dataUrl: slotMap[slotDef.index], capturedAt: 0 }
      : null,
  }));

  const allSlotsFilled = Object.keys(slotMap).length >= slotCount;

  const handleSlotClick = (slotIndex: number) => {
    setActiveSlotIndex((prev) => (prev === slotIndex ? null : slotIndex));
  };

  const handleAssign = (slotIndex: number, dataUrl: string) => {
    setSlotMap((prev) => ({ ...prev, [slotIndex]: dataUrl }));
    setActiveSlotIndex(null);
  };

  const handleClearSlot = (slotIndex: number) => {
    setSlotMap((prev) => {
      const next = { ...prev };
      delete next[slotIndex];
      return next;
    });
    if (activeSlotIndex === slotIndex) {
      setActiveSlotIndex(null);
    }
  };

  const handleDrag = (event: any, info: any) => {
    const elements = document.elementsFromPoint(info.point.x, info.point.y);
    const slotEl = elements.find((el) => el.hasAttribute("data-slot-index"));
    if (slotEl) {
      const index = parseInt(slotEl.getAttribute("data-slot-index") || "", 10);
      if (dragOverSlotIndex !== index) {
        setDragOverSlotIndex(index);
      }
    } else {
      if (dragOverSlotIndex !== null) {
        setDragOverSlotIndex(null);
      }
    }
  };

  const handleDragEnd = (photo: CapturedPhoto) => {
    if (dragOverSlotIndex !== null) {
      const targetSlot = dragOverSlotIndex;
      setTimeout(() => {
        handleAssign(targetSlot, photo.dataUrl);
      }, 0);
    }
    setDragOverSlotIndex(null);
  };

  const [isProcessing, setIsProcessing] = useState(false)

  const handleNext = async ({
    permission = false,
    overrideSlotMap
  }: {
    permission: boolean
    overrideSlotMap?: Record<number, string>
  }) => {
    const currentSlotMap = overrideSlotMap || slotMap
    const isFilled = Object.keys(currentSlotMap).length >= slotCount
    if (!isFilled || !layoutDef || !template) return

    const containerEl = document.getElementById('template-composite-container')
    const width = containerEl ? containerEl.getBoundingClientRect().width : 600
    const height = containerEl ? containerEl.getBoundingClientRect().height : 850

    setIsProcessing(true)

    try {
      const loadImage = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = src
        })

      const getCropParams = (srcW: number, srcH: number, slotW: number, slotH: number) => {
        const srcRatio = srcW / srcH
        const slotRatio = slotW / slotH
        let sx = 0, sy = 0, sw = srcW, sh = srcH
        if (srcRatio > slotRatio) { sw = srcH * slotRatio; sx = (srcW - sw) / 2 }
        else { sh = srcW / slotRatio; sy = (srcH - sh) / 2 }
        return { sx, sy, sw, sh }
      }

      const grade = selectedFilter.grade

      const templateImg = await loadImage(template.displayUrl)

      // ── 1. Composite foto → satu gambar (display resolution) ─────────────

      const photoCanvas = document.createElement('canvas')
      const dispW = layoutDef.templateSize?.w ?? width
      const dispH = layoutDef.templateSize?.h ?? height
      photoCanvas.width = dispW
      photoCanvas.height = dispH
      const photoCtx = photoCanvas.getContext('2d')!

      for (const slot of layoutDef.slots) {
        const dataUrl = currentSlotMap[slot.index]
        if (!dataUrl) continue
        const img = await loadImage(dataUrl)
        const slotCX = slot.cx * dispW
        const slotCY = slot.cy * dispH
        const slotW = slot.w * dispW
        const slotH = slot.h * dispH
        const angle = slot.angle ?? 0

        const { sx, sy, sw, sh } = getCropParams(img.width, img.height, slotW, slotH)

        photoCtx.save()
        photoCtx.translate(slotCX, slotCY)
        photoCtx.rotate((angle * Math.PI) / 180)
        photoCtx.beginPath()
        photoCtx.rect(-slotW / 2, -slotH / 2, slotW, slotH)
        photoCtx.clip()
        photoCtx.drawImage(img, sx, sy, sw, sh, -slotW / 2, -slotH / 2, slotW, slotH)
        photoCtx.restore()
      }

      if (grade) {
        applyColorGrade(photoCanvas, grade)
      }

      photoCtx.drawImage(templateImg, 0, 0, dispW, dispH)
      const resultPhotoDataUrl = photoCanvas.toDataURL('image/png', 0.95)

      // ── 1b. Composite foto → production (resolusi tinggi untuk print) ────

      const productionTemplateImg = await loadImage(template.productionUrl)
      const prodW = layoutDef.templateSize?.w ?? width
      const prodH = layoutDef.templateSize?.h ?? height

      const photoProductionCanvas = document.createElement('canvas')
      photoProductionCanvas.width = prodW
      photoProductionCanvas.height = prodH
      const photoProductionCtx = photoProductionCanvas.getContext('2d')!

      for (const slot of layoutDef.slots) {
        const dataUrl = currentSlotMap[slot.index]
        if (!dataUrl) continue
        const img = await loadImage(dataUrl)
        const slotCX = slot.cx * prodW
        const slotCY = slot.cy * prodH
        const slotW = slot.w * prodW
        const slotH = slot.h * prodH
        const angle = slot.angle ?? 0

        const { sx, sy, sw, sh } = getCropParams(img.width, img.height, slotW, slotH)

        photoProductionCtx.save()
        photoProductionCtx.translate(slotCX, slotCY)
        photoProductionCtx.rotate((angle * Math.PI) / 180)
        photoProductionCtx.beginPath()
        photoProductionCtx.rect(-slotW / 2, -slotH / 2, slotW, slotH)
        photoProductionCtx.clip()
        photoProductionCtx.drawImage(img, sx, sy, sw, sh, -slotW / 2, -slotH / 2, slotW, slotH)
        photoProductionCtx.restore()
      }

      if (grade) {
        applyColorGrade(photoProductionCanvas, grade)
      }

      photoProductionCtx.drawImage(productionTemplateImg, 0, 0, prodW, prodH)
      const resultPhotoProductionDataUrl = photoProductionCanvas.toDataURL('image/png', 0.95)

      // ── 2. Composite video → satu video (FINAL FIX untuk Intel UHD 630) ─────────
      const TARGET_DURATION_MS = countDownPhoto * 1000 // durasi output = countdown (hard-locked)
      const VIDEO_RENDER_FPS = 24 // 20fps: headroom encode di UHD 630 (naikkan ke 24/30 bila sudah stabil)
      const VIDEO_BITRATE = 800_000
      const VIDEO_MAX_WIDTH = 900 // cap lebar CANVAS VIDEO saja (foto/print tetap full-res)

      console.log('[VideoComposite] Starting video compositing...')
      console.log('[VideoComposite] Target duration:', TARGET_DURATION_MS, 'ms')

      const videoSlots: {
        videoEl: HTMLVideoElement;
        slot: typeof layoutDef.slots[0];
        durationMs: number
      }[] = []

      // Load semua video elements
      for (const slot of layoutDef.slots) {
        const assignedDataUrl = currentSlotMap[slot.index]
        if (!assignedDataUrl) continue

        const matchedCapture = captures.find(c => c.dataUrl === assignedDataUrl)
        if (!matchedCapture) continue

        const matchedVideo = capturesVideo.find(v => v.slotIndex === matchedCapture.slotIndex)
        if (!matchedVideo) continue

        console.log('[VideoComposite] Loading video for slot', slot.index)

        const videoEl = document.createElement('video')
        videoEl.muted = true
        videoEl.playsInline = true
        videoEl.loop = false
        videoEl.preload = 'auto'
        videoEl.src = URL.createObjectURL(matchedVideo.videoBlob)

        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          const timeout = window.setTimeout(() => {
            console.warn('[VideoComposite] Video loading timeout for slot', slot.index)
            cleanup()
            resolve()
          }, 5000)

          const cleanup = () => {
            window.clearTimeout(timeout)
            videoEl.onloadedmetadata = null
            videoEl.onloadeddata = null
            videoEl.oncanplaythrough = null
            videoEl.onerror = null
          }

          videoEl.onloadedmetadata = () => {
            console.log('[VideoComposite] Video metadata loaded, duration:', videoEl.duration, 's')
            try {
              videoEl.currentTime = 0
              videoEl.pause()
            } catch { }
            cleanup()
            resolve()
          }

          videoEl.oncanplaythrough = () => {
            console.log('[VideoComposite] Video can play through')
            try {
              videoEl.currentTime = 0
              videoEl.pause()
            } catch { }
            cleanup()
            resolve()
          }

          videoEl.onerror = () => {
            console.error('[VideoComposite] Video loading error for slot', slot.index)
            cleanup()
            resolve()
          }
        })

        // ── FIX: Handle Infinity duration ──
        const durationMs = Number.isFinite(videoEl.duration) && videoEl.duration > 0
          ? Math.round(videoEl.duration * 1000)
          : TARGET_DURATION_MS

        console.log('[VideoComposite] Video slot', slot.index, 'duration:', durationMs, 'ms')
        videoSlots.push({ videoEl, slot, durationMs })
      }

      // Hard-lock durasi output = countdown. TIDAK memakai Math.max dengan durasi video
      // sumber, karena metadata durasi WebM sumber tak reliable (kadang Infinity/melebihi).
      const targetDurationMs = TARGET_DURATION_MS
      console.log('[VideoComposite] Final target duration (hard-locked to countdown):', targetDurationMs, 'ms')

      const resultVideoBlob = await new Promise<Blob>(async (resolve, reject) => {
        // Downscale HANYA canvas video → drawImage + encode jauh lebih ringan di UHD 630.
        const nativeW = layoutDef.templateSize?.w ?? width
        const nativeH = layoutDef.templateSize?.h ?? height
        const videoScale = Math.min(1, VIDEO_MAX_WIDTH / nativeW)
        const outputWidth = Math.round(nativeW * videoScale)
        const outputHeight = Math.round(nativeH * videoScale)
        console.log('[VideoComposite] Output video size:', outputWidth, 'x', outputHeight, '(scale', videoScale.toFixed(3), ')')

        const canvas = document.createElement('canvas')
        canvas.width = outputWidth
        canvas.height = outputHeight
        const ctx = canvas.getContext('2d', { alpha: false })!
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Prepare template frame (static)
        const templateFrameCanvas = document.createElement('canvas')
        templateFrameCanvas.width = outputWidth
        templateFrameCanvas.height = outputHeight
        const templateFrameCtx = templateFrameCanvas.getContext('2d')!
        templateFrameCtx.drawImage(templateImg, 0, 0, outputWidth, outputHeight)

        // Container video: TETAP di dalam viewport (bukan left:-9999px) tapi 8x8px & nyaris
        // transparan. Chrome men-throttle decode video muted yang OFF-SCREEN ("paused to save
        // power") — inilah yang tadi bikin sebagian slot freeze. Di dalam viewport → Chrome
        // anggap visible → decode jalan terus, walau tak terlihat user (opacity 0.01).
        const hiddenVideoContainer = document.createElement('div')
        hiddenVideoContainer.style.cssText = 'position:fixed;left:0;bottom:0;width:8px;height:8px;opacity:0.01;pointer-events:none;z-index:0;overflow:hidden;'
        document.body.appendChild(hiddenVideoContainer)
        videoSlots.forEach(({ videoEl }) => hiddenVideoContainer.appendChild(videoEl))

        // captureStream(0): stream TIDAK meng-sample otomatis. Kita pancarkan frame secara
        // eksplisit via captureTrack.requestFrame() dari pump setInterval (berbasis timer).
        // Ini kunci fix: di Chrome, captureStream(fps) hanya memancarkan frame saat canvas
        // di-paint (terikat rAF) — dan rAF MATI saat GPU stall, bikin timeline kolaps ke ~0,3s.
        const stream = canvas.captureStream(0)
        const captureTrack = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined
        // Prioritaskan VP8 — UHD 630 tak punya HW VP9 encoder; VP8 software encode jauh lebih ringan.
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : MediaRecorder.isTypeSupported('video/webm')
            ? 'video/webm'
            : 'video/mp4'

        console.log('[VideoComposite] Using mimeType:', mimeType)

        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: VIDEO_BITRATE,
        })

        const chunks: Blob[] = []
        let recordingStartedAt = 0
        let renderIntervalId: number | null = null
        let stopTimeoutId: number | null = null
        let isRecording = false
        let framesRendered = 0

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data)
          }
        }

        recorder.onerror = (e) => {
          console.error('[VideoComposite] MediaRecorder error:', e)
          cleanup()
          reject(new Error('MediaRecorder failed'))
        }

        recorder.onstop = () => {
          console.log('[VideoComposite] Recording stopped. Total frames rendered:', framesRendered)
          console.log('[VideoComposite] Total chunks:', chunks.length)
          cleanup()
          const blob = new Blob(chunks, { type: mimeType })
          console.log('[VideoComposite] Final video blob size:', blob.size, 'bytes')
          resolve(blob)
        }

        const cleanup = () => {
          if (renderIntervalId) {
            clearInterval(renderIntervalId)
            renderIntervalId = null
          }
          if (stopTimeoutId) {
            clearTimeout(stopTimeoutId)
            stopTimeoutId = null
          }
          hiddenVideoContainer.remove()
          videoSlots.forEach(({ videoEl }) => {
            try {
              videoEl.pause()
              URL.revokeObjectURL(videoEl.src)
            } catch { }
          })
        }

        const stopRecording = () => {
          if (!isRecording) return
          isRecording = false

          console.log('[VideoComposite] Stopping recording...')

          // Pause all videos
          videoSlots.forEach(({ videoEl }) => {
            try {
              videoEl.pause()
            } catch { }
          })

          // Stop recorder after small delay
          window.setTimeout(() => {
            if (recorder.state !== 'inactive') {
              try {
                recorder.requestData()
                recorder.stop()
              } catch { }
            }
          }, 150)
        }

        // drawFrame: gambar SATU frame ke canvas lalu pancarkan EKSPLISIT ke stream via
        // requestFrame(). Dipompa oleh setInterval (berbasis timer), BUKAN rAF — timer tetap
        // firing walau compositor/rAF stall di bawah beban GPU, sehingga frame tersebar penuh
        // sepanjang 6 dtk dan durasi tak lagi kolaps.
        const drawFrame = () => {
          if (!isRecording) return

          framesRendered++

          // Clear canvas
          ctx.clearRect(0, 0, outputWidth, outputHeight)

          // ── Gambar VIDEO DULU (di bawah template) ──
          for (const { videoEl, slot } of videoSlots) {
            if (videoEl.readyState < 2 || videoEl.videoWidth <= 0 || videoEl.videoHeight <= 0) {
              continue
            }

            const slotCX = slot.cx * outputWidth
            const slotCY = slot.cy * outputHeight
            const slotW = slot.w * outputWidth
            const slotH = slot.h * outputHeight
            const angle = slot.angle ?? 0

            const { sx, sy, sw, sh } = getCropParams(
              videoEl.videoWidth,
              videoEl.videoHeight,
              slotW,
              slotH
            )

            ctx.save()
            ctx.translate(slotCX, slotCY)
            ctx.rotate((angle * Math.PI) / 180)
            ctx.beginPath()
            ctx.rect(-slotW / 2, -slotH / 2, slotW, slotH)
            ctx.clip()
            ctx.drawImage(videoEl, sx, sy, sw, sh, -slotW / 2, -slotH / 2, slotW, slotH)
            ctx.restore()
          }

          // ── Gambar template DI ATAS video ──
          ctx.drawImage(templateFrameCanvas, 0, 0, outputWidth, outputHeight)

          // Pancarkan frame ini ke MediaRecorder secara eksplisit (timeline = wall-clock tick).
          try {
            captureTrack?.requestFrame?.()
          } catch { }
        }

        // Start playback semua video
        const startPlayback = async () => {
          console.log('[VideoComposite] Starting video playback...')

          const playPromises = videoSlots.map(async ({ videoEl, slot }) => {
            try {
              videoEl.currentTime = 0
              videoEl.playbackRate = 1

              await videoEl.play()
              console.log('[VideoComposite] Video play() called for slot', slot.index)

              // ── FIX: Tunggu video benar-benar playing ──
              await new Promise<void>((resolve) => {
                const checkPlaying = () => {
                  if (!videoEl.paused && videoEl.currentTime > 0) {
                    resolve()
                  } else {
                    setTimeout(checkPlaying, 50)
                  }
                }
                setTimeout(checkPlaying, 100)
              })

              console.log('[VideoComposite] Video started playing for slot', slot.index, 'currentTime:', videoEl.currentTime)
              return true
            } catch (err) {
              console.error('[VideoComposite] Video play failed for slot', slot.index, err)
              return false
            }
          })

          const results = await Promise.all(playPromises)
          const successCount = results.filter(r => r).length
          console.log('[VideoComposite] Videos started playing:', successCount, '/', videoSlots.length)

          return successCount > 0
        }

        // Start recording
        try {
          console.log('[VideoComposite] Starting MediaRecorder...')
          recorder.start(100)

          // Start video playback FIRST
          const playbackStarted = await startPlayback()

          if (!playbackStarted) {
            console.error('[VideoComposite] No videos started playing, aborting')
            cleanup()
            reject(new Error('No videos started playing'))
            return
          }

          // ── FIX: Tunggu 200ms sebelum mulai render ──
          await new Promise(r => setTimeout(r, 200))

          // THEN start timer and render pump
          recordingStartedAt = performance.now()
          isRecording = true
          console.log('[VideoComposite] Recording started at', recordingStartedAt)

          // Pump gambar+requestFrame via setInterval (timer) — tahan terhadap rAF/compositor stall.
          drawFrame() // frame pertama segera
          renderIntervalId = window.setInterval(drawFrame, Math.round(1000 / VIDEO_RENDER_FPS))

          // ── Stop berbasis timer (independen dari rAF): INILAH yang menjamin durasi = countdown.
          // setTimeout tetap fire walau rAF/compositor stall, jadi durasi tak lagi kolaps.
          stopTimeoutId = window.setTimeout(() => {
            const elapsedMs = performance.now() - recordingStartedAt
            console.log('[VideoComposite] Stop timer fired. Elapsed:', elapsedMs, 'ms, framesRendered:', framesRendered)
            stopRecording()
          }, targetDurationMs)

          // Safety timeout (jaring pengaman kalau stop utama gagal)
          window.setTimeout(() => {
            if (isRecording) {
              console.warn('[VideoComposite] Safety timeout triggered')
              stopRecording()
            }
          }, targetDurationMs + 800)

        } catch (err) {
          console.error('[VideoComposite] Error starting recording:', err)
          cleanup()
          reject(err)
        }
      })

      console.log('[VideoComposite] Video compositing complete. Blob size:', resultVideoBlob.size)

      // ── 2b. Suntik metadata Duration ke WebM ────────────────────────────────
      // MediaRecorder WebM tak selalu menulis elemen Duration yang reliable → sebagian
      // player/webview membaca durasi sebagai Infinity/unknown sampai video diputar habis.
      // Karena durasi target kita PASTI (targetDurationMs), tulis eksplisit ke header.
      let finalVideoBlob = resultVideoBlob
      if (resultVideoBlob.type.includes('webm') && resultVideoBlob.size > 0) {
        try {
          finalVideoBlob = await fixWebmDuration(resultVideoBlob, targetDurationMs, { logger: false })
          console.log('[VideoComposite] Duration metadata injected:', targetDurationMs, 'ms. New blob size:', finalVideoBlob.size)
        } catch (e) {
          console.warn('[VideoComposite] fixWebmDuration gagal, pakai blob asli:', e)
          finalVideoBlob = resultVideoBlob
        }
      }

      // ── 3. GIF dari foto raw + grade ───────────────────────────────────────

      const resultGifBlob = await (async () => {
        // @ts-ignore
        const { GIFEncoder, quantize, applyPalette } = await import('gifenc')

        const gifWidth = Math.round(width)
        const gifHeight = Math.round(height)

        const encoder = GIFEncoder()
        const gifCanvas = document.createElement('canvas')
        gifCanvas.width = gifWidth
        gifCanvas.height = gifHeight
        const gifCtx = gifCanvas.getContext('2d')!

        const sortedCaptures = [...captures].sort((a, b) => a.slotIndex - b.slotIndex)

        for (const capture of sortedCaptures) {
          const img = await loadImage(capture.dataUrl)
          gifCtx.clearRect(0, 0, gifWidth, gifHeight)
          const { sx, sy, sw, sh } = getCropParams(img.width, img.height, gifWidth, gifHeight)
          gifCtx.drawImage(img, sx, sy, sw, sh, 0, 0, gifWidth, gifHeight)

          if (grade) {
            applyColorGrade(gifCanvas, grade)
          }

          const imageData = gifCtx.getImageData(0, 0, gifWidth, gifHeight)
          const palette = quantize(imageData.data, 256)
          const index = applyPalette(imageData.data, palette)
          encoder.writeFrame(index, gifWidth, gifHeight, { palette, delay: 800 })
        }

        encoder.finish()
        return new Blob([encoder.bytes()], { type: 'image/gif' })
      })()


      if (transaction?.invoiceNumber && captures.length > 0) {

        const dataUrlToFile = (dataUrl: string, filename: string): File => {
          const [meta, data] = dataUrl.split(',')
          const mimeType = meta.match(/:(.*?);/)?.[1] || 'image/jpeg'
          const binary = atob(data)
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
          return new File([bytes], filename, { type: mimeType })
        }

        const getRawPhoto = (index: number) => {
          const sorted = [...captures].sort((a, b) => a.slotIndex - b.slotIndex)
          const cap = sorted[index % sorted.length]
          return cap.dataUrl
        }

        try {
          const result = await createSessions({
            invoiceNumber: transaction?.invoiceNumber,
            tenantId: 1,
            isPublish: permission,
            photo1: dataUrlToFile(resultPhotoDataUrl, 'photo1.jpg'),
            photo2: dataUrlToFile(getRawPhoto(0), 'photo2.jpg'),
            photo3: dataUrlToFile(getRawPhoto(1), 'photo3.jpg'),
            photo4: dataUrlToFile(getRawPhoto(2), 'photo4.jpg'),
            photo5: dataUrlToFile(getRawPhoto(3), 'photo5.jpg'),
            gif: resultGifBlob,
            video: finalVideoBlob,
          })
          if (result.success === true) {
            setTemplateAndGif({
              templateWithPhoto: resultPhotoDataUrl,
              templateWithPhotoProduction: resultPhotoProductionDataUrl,
              templateWithVideo: finalVideoBlob,
              capturesToGIF: resultGifBlob,
            })
            continueToFinalization(result.result.sessionCode)
          }
        } catch (error) {
          console.error('Error creating session:', error)
        }

        try {
          await printPhotoBorderless({
            dataUrl: resultPhotoProductionDataUrl,
            totalCopy: transaction.totalPrint,
            paperSize: user?.paperType || "A4"
          })
        } catch (printErr) {
          console.error('Print gagal:', printErr)
        }
      }
    } catch (err) {
      console.error('handleNext error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    if (autoSubmit && template && layoutDef) {
      const tempSlotMap: Record<number, string> = {};
      const slotCount = layoutDef.slotCount;
      if (captures.length > 0) {
        for (let i = 0; i < slotCount; i++) {
          const cap = captures[i % captures.length];
          tempSlotMap[i] = cap.dataUrl;
        }
      }
      setSlotMap(tempSlotMap);
      handleNext({ permission: false, overrideSlotMap: tempSlotMap });
    }
  }, [autoSubmit, template, layoutDef]);

  const setBg = useUIStore((s) => s.setBackgroundVariant);

  useEffect(() => {
    setBg("image-white");
  }, []);

  if (!template || !layoutDef) {
    return (
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center w-full h-full gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <p className="font-body text-black text-3xl">
          Template tidak ditemukan.
        </p>
        <button
          onClick={goBack}
          className="font-body text-black underline text-xl"
        >
          ← Kembali pilih template
        </button>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        className="relative z-10 flex flex-col items-center justify-between w-full h-full py-12 px-14  gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex flex-row w-full justify-between items-center flex-shrink-0">
          <img
            src={logoBack}
            alt="Back"
            onClick={() => {
              switch (pageState) {
                case 'dragdrop':
                  goBack()
                  break;
                case 'selectfilter':
                  setPageState('dragdrop');
                  break;
              }
            }}
            className="touch-target w-48 h-max select-none cursor-pointer"
            draggable={false}
          />
          <div className="w-28" />
        </div>

        <div className="flex-1 flex flex-row items-center justify-center w-full min-h-0 gap-20 px-28">

          <div
            id="template-composite-container"
            className="relative flex-shrink-0 h-full"
            style={{
              aspectRatio: layoutDef.templateSize
                ? `${layoutDef.templateSize.w} / ${layoutDef.templateSize.h}`
                : "1 / 1.414",
              maxHeight: "100%",
            }}
          >
            <TemplateComposite
              templateUrl={template.displayUrl}
              slots={slots}
              selectedSlotIndex={activeSlotIndex}
              dragOverSlotIndex={dragOverSlotIndex}
              onSlotClick={handleSlotClick}
              onClearSlot={handleClearSlot}
              pageState={pageState}
              selectedFilter={selectedFilter}
            />

            <div className="absolute -top-3 -right-3 bg-retro-amber text-retro-brown font-body font-bold text-xs rounded-full px-2 py-0.5 shadow-lg">
              {Object.keys(slotMap).length}/{slotCount}
            </div>
          </div>

          <AnimatePresence>
            {
              pageState === 'dragdrop' ?
                <PhotoTray
                  captures={captures}
                  activeSlotIndex={activeSlotIndex}
                  onAssign={handleAssign}
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                />
                :
                <SelectFilterTray
                  selectedFilter={selectedFilter}
                  setSelectedFilter={setSelectedFilter}
                />
            }
          </AnimatePresence>
        </div>

        <div className="flex flex-row w-full justify-end items-center flex-shrink-0">
          <AnimatePresence>
            {allSlotsFilled && (
              <motion.img
                key="NEXT"
                src={btnNextBlack}
                alt="NEXT"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  switch (pageState) {
                    case 'dragdrop':
                      setPageState('selectfilter');
                      break;

                    case 'selectfilter':
                      setOpenModalPermission(true)
                      break;

                    default:
                      break;
                  }

                }}
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
      </motion.div>

      <AnimatePresence>
        {isProcessing && (
          <motion.div
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-16 h-16 border-4 border-retro-amber/30 border-t-retro-amber rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="font-gaming text-retro-amber text-sm mt-4">
              Memproses...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <VideoPreviewModal type="template" />
      <VideoPreviewModal type="capture" />

      <AskPermissionModal
        isOpen={openModalPermission}
        onAccept={() => {
          setOpenModalPermission(false)
          handleNext({ permission: true })
        }}
        onDecline={() => {
          setOpenModalPermission(false)
          handleNext({ permission: false })
        }}
      />
    </>
  );
}