import { btnBackGold, btnNextGold, logoBack, logoChooseFrame } from "@/assets";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { usePhotoStore } from "@/store/photoStore";
import { useUIStore } from "@/store/uiStore";
import { useTemplateStore } from "@/store/templateStore";
import { motion } from "framer-motion";
import { useEffect, useLayoutEffect } from "react";
import { getLayoutDef } from "@/config/layouts.config";

export function TemplatePage() {
  const { goNext, goBack } = useSessionStore();
  const { captures, setTemplate } = usePhotoStore();
  const setBg = useUIStore((s) => s.setBackgroundVariant);
  const { user } = useAuthStore();

  // Data templat berasal dari store yang sudah di-prefetch di TakePhotoPage.
  // Pada titik ini list + gambar umumnya sudah hangat di HTTP cache, jadi
  // carousel langsung tampil tanpa menunggu.
  const templates = useTemplateStore((s) => s.templates);
  const selectedTemplate = useTemplateStore((s) => s.selectedTemplate);
  const setSelectedTemplate = useTemplateStore((s) => s.setSelectedTemplate);
  const storeLoading = useTemplateStore((s) => s.loading);
  const thumbs = useTemplateStore((s) => s.thumbs);
  const ensureTemplatesLoaded = useTemplateStore((s) => s.ensureTemplatesLoaded);

  const loading = storeLoading && templates.length === 0;

  // Terapkan background SEBELUM paint pertama agar tidak ada kedip
  // image-white → image-black saat halaman ini muncul.
  useLayoutEffect(() => {
    setBg("image-black");
  }, [setBg]);

  // Jaring pengaman: kalau user mendarat di sini tanpa lewat prefetch
  // (mis. reload di tengah sesi), muat sekarang. Idempoten — no-op bila
  // sudah dimuat.
  useEffect(() => {
    if (user) ensureTemplatesLoaded(user.tenantId);
  }, [user, ensureTemplatesLoaded]);

  if (captures.length === 0) {
    return (
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center w-full h-full gap-4 py-12 px-14"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <p className="font-body text-white text-3xl">
          Foto Tidak Ditemukan
        </p>
        <button
          onClick={goBack}
          className="font-body text-white underline text-xl"
        >
          ← Kembali ambil foto
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-12 px-14"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* HEADER — rotate dihapus, delay dirapatkan, durasi dipersingkat */}
      <div className="flex flex-row w-full justify-between items-center">
        <motion.img
          src={btnBackGold}
          alt="Back"
          whileTap={{ scale: 0.95 }}
          onClick={goBack}
          className="touch-target w-48 h-max select-none cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          draggable={false}
        />
        <motion.img
          src={logoChooseFrame}
          alt="Voucher"
          className="w-[650px] h-[200px] select-none pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          draggable={false}
        />
        <img
          src={logoBack}
          alt="How To Use"
          className="w-48 h-max select-none pointer-events-none cursor-pointer invisible"
          draggable={false}
        />
      </div>

      {/* ── CAROUSEL AREA ── */}
      <div className="flex-1 flex items-center w-full overflow-hidden">
        {loading && (
          <p className="font-body text-retro-cream/60 text-xl mx-auto">
            Memuat template...
          </p>
        )}
        {!loading && (
          <div
            className="w-full h-full flex items-center"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {/* Scrollable track */}
            <div
              className="flex gap-12 px-16 py-6 overflow-x-auto h-full items-center w-full"
              style={{
                scrollSnapType: "x mandatory",
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
                overscrollBehaviorX: "contain",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {templates.map((t, indx) => {
                const isSelected = selectedTemplate?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    style={{ scrollSnapAlign: "center", flexShrink: 0 }}
                    className={[
                      "relative flex flex-col items-center rounded-2xl transition-transform duration-200 select-none cursor-pointer focus:outline-none",
                      "w-max h-max",
                      "border-4",
                      isSelected
                        ? "border-retro-amber scale-110 z-10"
                        : "border-transparent hover:border-retro-amber/40 hover:scale-105",
                    ].join(" ")}
                  >
                    {t.displayUrl ? (
                      (() => {
                        const tLayoutDef = getLayoutDef(t.layoutId)
                        return (
                          <div
                            className="relative h-80 w-auto"
                            style={{
                              aspectRatio: tLayoutDef?.templateSize
                                ? `${tLayoutDef.templateSize.w} / ${tLayoutDef.templateSize.h}`
                                : '1 / 1.414',
                            }}
                          >
                            {/* Layer 1: Slot placeholder */}
                            {tLayoutDef?.slots.map((slot, index) => (
                              <div
                                key={slot.index}
                                style={{
                                  position: 'absolute',
                                  backgroundColor: "#DBDBDB",
                                  left: `${slot.cx * 100}%`,
                                  top: `${slot.cy * 100}%`,
                                  width: `${slot.w * 100}%`,
                                  height: `${slot.h * 100}%`,
                                  transform: `translate(-50%, -50%) rotate(${slot.angle}deg)`
                                }}
                                className="flex flex-col items-center justify-center bg-retro-cream/10 border border-dashed border-retro-cream/30"
                              >
                                <span className="text-xl leading-none font-gaming bg-white text-black py-2 px-3 rounded-full">
                                  {index + 1}
                                </span>
                              </div>
                            ))}

                            {/* Layer 2: Template PNG overlay */}
                            <img
                              src={thumbs[t.id] ?? t.displayUrl}
                              alt={`Template-${indx}`}
                              draggable={false}
                              decoding="async"
                              className="absolute inset-0 h-full w-full pointer-events-none rounded-xl"
                              style={{ objectFit: 'fill' }}
                            />
                          </div>
                        )
                      })()
                    ) : (
                      <div className="h-80 w-44 bg-retro-cream/10 rounded-xl flex flex-col items-center justify-center gap-2">
                        <span className="text-retro-cream/30 font-body text-4xl">⬜</span>
                      </div>
                    )}

                    {isSelected && (
                      <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-retro-amber" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-row w-full justify-end items-center">
        <motion.img
          key={"NEXT"}
          src={btnNextGold}
          alt={"NEXT"}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (selectedTemplate) {
              setTemplate(selectedTemplate);
            }
            goNext();
          }}
          className="touch-target w-48 h-max select-none cursor-pointer transition-all"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          draggable={false}
        />
      </div>
    </motion.div>
  );
}