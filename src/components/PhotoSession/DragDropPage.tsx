import { btnNextBlack, logoBack, logoChooseFilter, logoDragAndDrop, logoWindowControl } from "@/assets";
import { getLayoutDef } from "@/config/layouts.config";
import { createSessions } from "@/services/finalizeService";
import { printPhotoBorderless } from '@/services/printService';
import { CapturedPhoto, usePhotoStore } from "@/store/photoStore";
import { useSessionStore } from "@/store/sessionStore";
import { useUIStore } from "@/store/uiStore";
import type { SlotDef } from "@/types/layout";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { VideoPreviewModal } from "./VideoPreviewModal";
import { useAuthStore } from "@/store/authStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlotState {
  slotDef: SlotDef;
  photo: CapturedPhoto | null;
}

type FilterId =
  | 'original'
  | 'kodakVintage'
  | 'noirFilm'
  | 'digicam200s'
  | '80sRetro'
  | 'dramaticB&W'
  | 'dreamyVintage'

interface Filter {
  id: FilterId
  label: string
  cssFilter: string
}

const FILTERS: Array<Filter> = [
  {
    id: 'original',
    label: 'Original',
    cssFilter: 'none',
  },

  {
    id: 'kodakVintage',
    label: 'Kodak Vintage',
    cssFilter:
      "sepia(0.45) saturate(0.8) contrast(0.95) brightness(1.12) hue-rotate(-12deg)",
  },

  {
    id: 'noirFilm',
    label: 'Noir Film',
    cssFilter:
      "grayscale(1) contrast(1.7) brightness(1.02)"
  },

  {
    id: 'digicam200s',
    label: 'Digicam 2000s',
    cssFilter:
      'saturate(1.6) contrast(1.25) brightness(1.12)',
  },

  {
    id: '80sRetro',
    label: '80s Retro',
    cssFilter:
      'sepia(0.2) saturate(1.25) contrast(1.1) brightness(1.05) hue-rotate(-20deg)',
  },

  {
    id: 'dramaticB&W',
    label: 'Dramatic B&W',
    cssFilter:
      'grayscale(1) contrast(2) brightness(0.92)',
  },

  {
    id: 'dreamyVintage',
    label: 'Dreamy Vintage',
    cssFilter:
      'sepia(0.2) saturate(0.85) brightness(1.15) contrast(0.9) saturate(0.9)',
  }
]

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
            {/* Header */}
            <div className="bg-[#F7CC40] px-5 py-4 flex items-center justify-between">
              <h2 className="font-gaming text-[#2C2C2C] text-3xl">ASK FOR PERMISSION</h2>
              <img src={logoWindowControl} alt="Window-Control" className="select-none pointer-events-none h-auto" />
            </div>

            {/* Content */}
            <div className="bg-[#FCF8EF] px-8 py-8 flex flex-col gap-6">
              <p className="font-gaming text-[#2C2C2C] text-2xl py-2 text-center">
                Your photos look amazing! Would you allow us to feature them on @retroppies?
              </p>

              {/* Buttons */}
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

/**
 * Renders the template composite:
 *   Layer 1 (bottom): Photo fills each slot area via absolutely positioned <div>
 *   Layer 2 (top):    Template PNG (with transparent holes) sits over everything
 */
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
    // Outer wrapper — maintains template's natural aspect ratio
    <div className="relative w-full h-full select-none">
      {/* ── Layer 1: photo fills per slot ── */}
      {slots.map(({ slotDef, photo }) => (
        <div
          key={slotDef.index}
          data-slot-index={slotDef.index}
          onClick={() => onSlotClick(slotDef.index)}
          style={{
            position: "absolute",
            left: `${slotDef.x * 100}%`,
            top: `${slotDef.y * 100}%`,
            width: `${slotDef.w * 100}%`,
            height: `${slotDef.h * 100}%`,
            overflow: "hidden",
            cursor: "pointer",
          }}
          className="group relative"
        >
          {photo ? (
            <div className="relative w-full h-full">
              <img
                style={{
                  filter: selectedFilter.cssFilter
                }}
                src={photo.dataUrl}
                alt={`Slot ${slotDef.index + 1}`}
                draggable={false}
                className="w-full h-full object-cover"
              />
              {/* Clear button inside slot */}
              {pageState === 'dragdrop' &&
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // prevent selecting slot
                    onClearSlot(slotDef.index);
                  }}
                  className="absolute top-2 right-2 w-4 h-4 rounded-full bg-retro-brown/90 border border-retro-amber text-retro-amber flex items-center justify-center font-bold text-[10px] shadow-md hover:bg-retro-amber hover:text-retro-brown active:scale-95 transition-all duration-150 z-20 touch-target"
                >
                  ✕
                </button>
              }
            </div>
          ) : (
            /* Empty slot placeholder — visible through the transparent hole */
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/30 group-hover:bg-retro-amber/10 transition-colors duration-200">
              <span className="font-gaming text-3xl mb-1">＋</span>
              <span className="font-gaming text-sm">
                Slot {slotDef.index + 1}
              </span>
            </div>
          )}

          {/* Slot highlight ring when selected or dragged over */}
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

      {/* ── Layer 2: template PNG overlay (transparent holes reveal photos) ── */}
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
        initial={{ rotate: -20, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
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
              // Catat posisi awal untuk ghost element
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
                // Update posisi ghost
                setDragPosition({ x: info.point.x, y: info.point.y })
                onDrag(event, info)
              }}
              onDragStart={() => setDraggingPhoto(photo)}
              onDragEnd={() => {
                onDragEnd(photo)
                setDraggingPhoto(null)
              }}
              whileDrag={{ opacity: 0.3 }} // Original memudar saat di-drag
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

      {/* Ghost element di-render via Portal langsung ke body — bebas dari overflow-hidden */}
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
function SelectFilterTray({
  selectedFilter,
  setSelectedFilter,
}: {
  selectedFilter: Filter
  setSelectedFilter: (filter: Filter) => void
}) {
  const { captures } = usePhotoStore()
  return (
    <div className="flex flex-col h-full gap-2 justify-between items-center w-[50%] z-50">
      <motion.img
        src={logoChooseFilter}
        alt="Drag and Drop"
        className="w-80 h-20 select-none pointer-events-none"
        initial={{ rotate: -20, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        draggable={false}
      />
      <div className="grid grid-cols-2 gap-4 h-full w-full overflow-y-scroll bg-[#B23E3E] p-4 rounded-3xl">
        {FILTERS.map((filter) => (
          <div
            key={filter.id}
            className={[
              "rounded-xl w-full flex-col p-2 border-4  transition-all duration-200 flex-shrink-0 cursor-grab active:cursor-grabbing flex justify-center items-center",
              'border-[#B23E3E] hover:border-[#F8F8F8] hover:scale-[1.02]',
              selectedFilter.id == filter.id && 'border-[#F8F8F8]'
            ].join(" ")}
            onClick={() => {
              // if (activeSlotIndex !== null) onAssign(activeSlotIndex, photo.dataUrl)
              setSelectedFilter(filter)
            }}
          >
            <img
              style={{
                filter: filter.cssFilter
              }}
              src={captures[0].dataUrl}
              alt={`FilteredPhoto ${filter.label}`}
              className="w-full h-72 object-cover pointer-events-none rounded-xl"
            />
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

  const [selectedFilter, setSelectedFilter] = useState<Filter>({
    id: 'original',
    label: 'Original',
    cssFilter: 'none',
  })

  const { goBack, continueToFinalization, transaction, autoSubmit } = useSessionStore();
  const { user } = useAuthStore()
  const { template, captures, capturesVideo, setTemplateAndGif } = usePhotoStore();

  // slotMap: { [slotIndex]: dataUrl }
  const [slotMap, setSlotMap] = useState<Record<number, string>>({});

  // Which slot is currently "active" / waiting for a photo tap
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  // Drag-and-drop state
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);

  // ── Derive layout from template.layoutId ──────────────────────────────────
  const layoutDef = template ? getLayoutDef(template.layoutId) : null;
  const slotCount = layoutDef?.slotCount ?? 1;

  const slots: SlotState[] = (layoutDef?.slots ?? []).map((slotDef) => ({
    slotDef,
    photo: slotMap[slotDef.index]
      ? { slotIndex: slotDef.index, dataUrl: slotMap[slotDef.index], capturedAt: 0 }
      : null,
  }));

  const allSlotsFilled = Object.keys(slotMap).length >= slotCount;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSlotClick = (slotIndex: number) => {
    // Toggle: tap again to deselect
    setActiveSlotIndex((prev) => (prev === slotIndex ? null : slotIndex));
  };

  const handleAssign = (slotIndex: number, dataUrl: string) => {
    setSlotMap((prev) => ({ ...prev, [slotIndex]: dataUrl }));
    setActiveSlotIndex(null); // deselect after assigning
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
      // Push state update to next tick to allow Framer Motion to release drag state cleanly
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

      // Filter CSS dari selectedFilter — dipakai di ctx.filter
      const cssFilter = selectedFilter.cssFilter === 'none' ? '' : selectedFilter.cssFilter

      const templateImg = await loadImage(template.displayUrl)

      // ── 1. Composite foto + filter → satu gambar ─────────────────────────

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
        const slotX = slot.x * dispW, slotY = slot.y * dispH
        const slotW = slot.w * dispW, slotH = slot.h * dispH
        const { sx, sy, sw, sh } = getCropParams(img.width, img.height, slotW, slotH)

        photoCtx.save()
        photoCtx.beginPath()
        photoCtx.rect(slotX, slotY, slotW, slotH)
        photoCtx.clip()
        photoCtx.filter = cssFilter || 'none' // ← Apply filter ke foto
        photoCtx.drawImage(img, sx, sy, sw, sh, slotX, slotY, slotW, slotH)
        photoCtx.filter = 'none' // ← Reset filter sebelum gambar template overlay
        photoCtx.restore()
      }

      // Template overlay tidak kena filter
      photoCtx.filter = 'none'
      photoCtx.drawImage(templateImg, 0, 0, dispW, dispH)
      const resultPhotoDataUrl = photoCanvas.toDataURL('image/png', 0.95)

      // ── 1b. Composite foto + filter → production (pakai productionUrl) ────────
      //
      // Logika identik dengan di atas, bedanya template overlay menggunakan
      // productionUrl yang resolusinya lebih tinggi untuk keperluan print

      const productionTemplateImg = await loadImage(template.productionUrl)

      // Canvas production menggunakan ukuran asli template (bukan ukuran layar)
      // agar resolusi output setinggi mungkin
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
        const slotX = slot.x * prodW, slotY = slot.y * prodH
        const slotW = slot.w * prodW, slotH = slot.h * prodH
        const { sx, sy, sw, sh } = getCropParams(img.width, img.height, slotW, slotH)
        photoProductionCtx.save()
        photoProductionCtx.beginPath()
        photoProductionCtx.rect(slotX, slotY, slotW, slotH)
        photoProductionCtx.clip()
        photoProductionCtx.filter = cssFilter || 'none'
        photoProductionCtx.drawImage(img, sx, sy, sw, sh, slotX, slotY, slotW, slotH)
        photoProductionCtx.filter = 'none'
        photoProductionCtx.restore()
      }
      photoProductionCtx.filter = 'none'
      photoProductionCtx.drawImage(productionTemplateImg, 0, 0, prodW, prodH)
      const resultPhotoProductionDataUrl = photoProductionCanvas.toDataURL('image/png', 0.95)

      // ── 2. Composite video + filter → satu video ─────────────────────────

      const videoSlots: { videoEl: HTMLVideoElement; slot: typeof layoutDef.slots[0] }[] = []

      for (const slot of layoutDef.slots) {
        const assignedDataUrl = currentSlotMap[slot.index]
        if (!assignedDataUrl) continue
        const matchedCapture = captures.find(c => c.dataUrl === assignedDataUrl)
        if (!matchedCapture) continue
        const matchedVideo = capturesVideo.find(v => v.slotIndex === matchedCapture.slotIndex)
        if (!matchedVideo) continue

        const videoEl = document.createElement('video')
        videoEl.muted = true
        videoEl.playsInline = true
        videoEl.loop = false
        videoEl.src = URL.createObjectURL(matchedVideo.videoBlob)
        await new Promise<void>((res, rej) => {
          videoEl.onloadedmetadata = () => res()
          videoEl.onerror = rej
        })
        videoSlots.push({ videoEl, slot })
      }

      const resultVideoBlob = await new Promise<Blob>((resolve, reject) => {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4'

        const stream = canvas.captureStream(30)
        const recorder = new MediaRecorder(stream, { mimeType })
        const chunks: Blob[] = []

        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }))
        recorder.onerror = reject

        recorder.start()
        videoSlots.forEach(({ videoEl }) => videoEl.play())

        const renderLoop = () => {
          const allEnded = videoSlots.every(({ videoEl }) => videoEl.ended)
          if (allEnded) {
            recorder.stop()
            videoSlots.forEach(({ videoEl }) => URL.revokeObjectURL(videoEl.src))
            return
          }

          ctx.clearRect(0, 0, width, height)

          for (const { videoEl, slot } of videoSlots) {
            if (videoEl.ended) continue
            const slotX = slot.x * width, slotY = slot.y * height
            const slotW = slot.w * width, slotH = slot.h * height
            const { sx, sy, sw, sh } = getCropParams(videoEl.videoWidth, videoEl.videoHeight, slotW, slotH)

            ctx.save()
            ctx.beginPath()
            ctx.rect(slotX, slotY, slotW, slotH)
            ctx.clip()
            ctx.filter = cssFilter || 'none' // ← Apply filter ke video frame
            ctx.drawImage(videoEl, sx, sy, sw, sh, slotX, slotY, slotW, slotH)
            ctx.filter = 'none'
            ctx.restore()
          }

          // Template overlay tidak kena filter
          ctx.filter = 'none'
          ctx.drawImage(templateImg, 0, 0, width, height)

          requestAnimationFrame(renderLoop)
        }

        const firstVideo = videoSlots[0]?.videoEl
        if (firstVideo) { firstVideo.onplay = () => requestAnimationFrame(renderLoop) }
        else { recorder.stop(); resolve(new Blob([], { type: mimeType })) }
      })

      // ── 3. GIF dari foto raw + filter ────────────────────────────────────

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

          gifCtx.filter = cssFilter || 'none' // ← Apply filter ke tiap frame GIF
          gifCtx.drawImage(img, sx, sy, sw, sh, 0, 0, gifWidth, gifHeight)
          gifCtx.filter = 'none'

          const imageData = gifCtx.getImageData(0, 0, gifWidth, gifHeight)
          const palette = quantize(imageData.data, 256)
          const index = applyPalette(imageData.data, palette)
          encoder.writeFrame(index, gifWidth, gifHeight, { palette, delay: 800 })
        }

        encoder.finish()
        return new Blob([encoder.bytes()], { type: 'image/gif' })
      })()


      if (transaction?.invoiceNumber && captures.length > 0) {

        // Helper: konversi dataUrl → File
        const dataUrlToFile = (dataUrl: string, filename: string): File => {
          const [meta, data] = dataUrl.split(',')
          const mimeType = meta.match(/:(.*?);/)?.[1] || 'image/jpeg'
          const binary = atob(data)
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
          return new File([bytes], filename, { type: mimeType })
        }

        // Helper to get raw photo by repeating available captures
        const getRawPhoto = (index: number) => {
          const sorted = [...captures].sort((a, b) => a.slotIndex - b.slotIndex)
          const cap = sorted[index % sorted.length]
          return cap.dataUrl
        }

        // ---------------
        try {
          const result = await createSessions({
            invoiceNumber: transaction?.invoiceNumber,
            tenantId: 1,
            isPublish: permission,
            photo1: dataUrlToFile(resultPhotoDataUrl, 'photo1.jpg'),      // ← foto composited
            photo2: dataUrlToFile(getRawPhoto(0), 'photo2.jpg'), // ← foto raw slot 0
            photo3: dataUrlToFile(getRawPhoto(1), 'photo3.jpg'), // ← foto raw slot 1
            photo4: dataUrlToFile(getRawPhoto(2), 'photo4.jpg'), // ← foto raw slot 2
            photo5: dataUrlToFile(getRawPhoto(3), 'photo5.jpg'), // ← foto raw slot 3
            gif: resultGifBlob,
            video: resultVideoBlob,
          })
          if (result.success === true) {
            // ── 4. Simpan & navigasi ──────────────────────────────────────────────
            setTemplateAndGif({
              templateWithPhoto: resultPhotoDataUrl,
              templateWithPhotoProduction: resultPhotoProductionDataUrl,
              templateWithVideo: resultVideoBlob,
              capturesToGIF: resultGifBlob,
            })
            continueToFinalization(result.result.sessionCode)
          }
          console.log('Session created successfully:', result)
        } catch (error) {
          console.error('Error creating session:', error)
        }
        // ---------------

        // ---------------
        try {
          await printPhotoBorderless({
            dataUrl: resultPhotoProductionDataUrl,
            totalCopy: transaction.totalPrint,
            paperSize: user?.paperType || "A4"
          })
        } catch (printErr) {
          console.error('Print gagal:', printErr)
        }
        // ---------------
      }
    } catch (err) {
      console.error('handleNext error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    if (autoSubmit && template && layoutDef) {
      // 1. Auto fill slotMap
      const tempSlotMap: Record<number, string> = {};
      const slotCount = layoutDef.slotCount;
      if (captures.length > 0) {
        for (let i = 0; i < slotCount; i++) {
          const cap = captures[i % captures.length];
          tempSlotMap[i] = cap.dataUrl;
        }
      }
      setSlotMap(tempSlotMap);

      // 2. Trigger submit with populated slotMap
      handleNext({ permission: false, overrideSlotMap: tempSlotMap });
    }
  }, [autoSubmit, template, layoutDef]);

  const setBg = useUIStore((s) => s.setBackgroundVariant);

  useEffect(() => {
    setBg("image-white");
    return () => setBg("video-black");
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
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -60 }}
      >
        {/* ── Header row ── */}
        <div className="flex flex-row w-full justify-between items-center flex-shrink-0">
          <motion.img
            src={logoBack}
            alt="Back"
            whileTap={{ scale: 0.95 }}
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

        {/* ── Main content: template preview + photo tray ── */}
        <div className="flex-1 flex flex-row items-center justify-center w-full min-h-0 gap-20 px-28">

          {/* Template composite — fills height, keeps aspect ratio */}
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

            {/* Slot fill progress badge */}
            <div className="absolute -top-3 -right-3 bg-retro-amber text-retro-brown font-body font-bold text-xs rounded-full px-2 py-0.5 shadow-lg">
              {Object.keys(slotMap).length}/{slotCount}
            </div>
          </div>

          <AnimatePresence>
            {
              pageState === 'dragdrop' ?
                // Photo tray — vertical on the right
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

        {/* ── Footer row ── */}
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
                      // handleNext();
                      break;

                    default:
                      break;
                  }

                }}
                className="touch-target w-48 h-max select-none cursor-pointer"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                draggable={false}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Loading overlay */}
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

      {/* DEV */}
      {/* <VideoPreviewModal type="template" /> */}

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
