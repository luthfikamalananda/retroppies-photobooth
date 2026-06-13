import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { usePhotoStore } from "@/store/photoStore";
import { getLayoutDef } from "@/config/layouts.config";
import type { SlotDef } from "@/types/layout";
import type { CapturedPhoto } from "@/store/photoStore";
import { btnBackGold, btnNextGold } from "@/assets";
import { useUIStore } from "@/store/uiStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlotState {
  slotDef: SlotDef;
  photo: CapturedPhoto | null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Renders the template composite:
 *   Layer 1 (bottom): Photo fills each slot area via absolutely positioned <img>
 *   Layer 2 (top):    Template PNG (with transparent holes) sits over everything
 */
function TemplateComposite({
  templateUrl,
  slots,
  selectedSlotIndex,
  onSlotClick,
}: {
  templateUrl: string;
  slots: SlotState[];
  selectedSlotIndex: number | null;
  onSlotClick: (index: number) => void;
}) {
  return (
    // Outer wrapper — maintains template's natural aspect ratio
    <div className="relative w-full h-full select-none">
      {/* ── Layer 1: photo fills per slot ── */}
      {slots.map(({ slotDef, photo }) => (
        <button
          key={slotDef.index}
          onClick={() => onSlotClick(slotDef.index)}
          style={{
            position: "absolute",
            left: `${slotDef.x * 100}%`,
            top: `${slotDef.y * 100}%`,
            width: `${slotDef.w * 100}%`,
            height: `${slotDef.h * 100}%`,
            // HARDCODE
            // zIndex: 99,
            overflow: "hidden",
            cursor: "pointer",
          }}
          className="focus:outline-none group"
        >
          {photo ? (
            <img
              src={photo.dataUrl}
              alt={`Slot ${slotDef.index + 1}`}
              draggable={false}
              className="w-full h-full object-cover pointer-events-none"
            />
          ) : (
            /* Empty slot placeholder — visible through the transparent hole */
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/30 group-hover:bg-retro-amber/10 transition-colors duration-200">
              <span className="text-geming text-3xl mb-1">＋</span>
              <span className="text-retro-cream/30 font-body text-xs">
                Slot {slotDef.index + 1}
              </span>
            </div>
          )}

          {/* Slot highlight ring when selected */}
          {selectedSlotIndex === slotDef.index && (
            <div
              className="absolute inset-0 border-4 border-retro-amber pointer-events-none animate-pulse"
              style={{ boxShadow: "inset 0 0 0 2px rgba(212,160,23,0.4)" }}
            />
          )}
        </button>
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

function PhotoTray({
  captures,
  activeSlotIndex,
  onAssign,
}: {
  captures: CapturedPhoto[];
  activeSlotIndex: number | null;
  onAssign: (slotIndex: number, dataUrl: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <p className="font-body text-retro-cream/50 text-xs text-center">
        {activeSlotIndex !== null
          ? `Pilih foto untuk Slot ${activeSlotIndex + 1}`
          : "Ketuk slot lalu pilih foto"}
      </p>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {captures.map((photo) => (
          <button
            key={photo.slotIndex}
            onClick={() => {
              if (activeSlotIndex !== null) {
                onAssign(activeSlotIndex, photo.dataUrl);
              }
            }}
            disabled={activeSlotIndex === null}
            className={[
              "flex-shrink-0 w-24 aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all duration-200",
              activeSlotIndex !== null
                ? "border-retro-amber/60 hover:border-retro-amber hover:scale-105 cursor-pointer"
                : "border-retro-cream/10 cursor-default opacity-50",
            ].join(" ")}
          >
            <img
              src={photo.dataUrl}
              alt={`Foto ${photo.slotIndex + 1}`}
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DragDropPage() {
  const { goNext, goBack } = useSessionStore();
  const { captures } = usePhotoStore();

  // selectedTemplate dari TemplatePage disimpan di photoStore
  const template = usePhotoStore((s) => s.template);

  // slotMap: { [slotIndex]: dataUrl }
  const [slotMap, setSlotMap] = useState<Record<number, string>>({});

  // Which slot is currently "active" / waiting for a photo tap
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

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

  // ── Render ────────────────────────────────────────────────────────────────

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
        <p className="font-body text-retro-cream/50 text-lg">
          Template tidak ditemukan.
        </p>
        <button
          onClick={goBack}
          className="font-body text-retro-amber underline text-sm"
        >
          ← Kembali pilih template
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-8 px-10 gap-4"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
    >
      {/* ── Header row ── */}
      <div className="flex flex-row w-full justify-between items-center flex-shrink-0">
        <motion.img
          src={btnBackGold}
          alt="Back"
          whileTap={{ scale: 0.95 }}
          onClick={goBack}
          className="touch-target w-28 h-max select-none cursor-pointer"
          draggable={false}
        />
        {/* 
        <p className="font-display text-retro-amber text-2xl tracking-wide">
          Atur Foto
        </p> */}

        {/* placeholder to balance flex */}
        <div className="w-28" />
      </div>

      {/* ── Main content: template preview + photo tray ── */}
      <div className="flex-1 flex flex-row items-center justify-center gap-8 w-full min-h-0">

        {/* Template composite — fills height, keeps aspect ratio */}
        <div
          className="relative flex-shrink-0 h-full"
          style={{
            // Maintain template aspect ratio based on templateSize, default A4-ish
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
            onSlotClick={handleSlotClick}
          />

          {/* Slot fill progress badge */}
          <div className="absolute -top-3 -right-3 bg-retro-amber text-retro-brown font-body font-bold text-xs rounded-full px-2 py-0.5 shadow-lg">
            {Object.keys(slotMap).length}/{slotCount}
          </div>
        </div>

        {/* Photo tray — vertical on the right */}
        <div className="flex flex-col justify-center gap-4 w-36 flex-shrink-0 h-full overflow-y-auto">
          <p className="font-body text-retro-cream/50 text-xs text-center">
            {activeSlotIndex !== null
              ? `→ Slot ${activeSlotIndex + 1}`
              : "Ketuk slot di template"}
          </p>

          {captures.map((photo) => (
            <button
              key={photo.slotIndex}
              onClick={() => {
                if (activeSlotIndex !== null) {
                  handleAssign(activeSlotIndex, photo.dataUrl);
                }
              }}
              disabled={activeSlotIndex === null}
              className={[
                "w-full aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0",
                activeSlotIndex !== null
                  ? "border-retro-amber/60 hover:border-retro-amber hover:scale-105 cursor-pointer active:scale-95"
                  : "border-retro-cream/10 cursor-default opacity-40",
              ].join(" ")}
            >
              <img
                src={photo.dataUrl}
                alt={`Foto ${photo.slotIndex + 1}`}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
            </button>
          ))}
        </div>
      </div>

      {/* ── Footer row ── */}
      <div className="flex flex-row w-full justify-end items-center flex-shrink-0">
        <AnimatePresence>
          {allSlotsFilled && (
            <motion.img
              key="NEXT"
              src={btnNextGold}
              alt="NEXT"
              whileTap={{ scale: 0.95 }}
              onClick={goNext}
              className="touch-target w-36 h-max select-none cursor-pointer"
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
  );
}
