import { btnBackGold, btnNextGold, logoBack, logoChooseFrame } from "@/assets";
import { getTemplates, Template } from "@/services/templateService";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { usePhotoStore } from "@/store/photoStore";
import { useUIStore } from "@/store/uiStore";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function TemplatePage() {
  const { goNext, goBack } = useSessionStore();
  const setTemplateInStore = usePhotoStore((s) => s.setTemplate);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const setBg = useUIStore((s) => s.setBackgroundVariant);
  const { user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  let isInitialized = false; // flag untuk memastikan init hanya sekali

  useEffect(() => {
    setBg("image-black");
    return () => setBg("video-black");
  }, []);

  useEffect(() => {
    if (isInitialized) return;
    isInitialized = true;
    if (!user) {
      setError("User tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }
    setTemplates([]);
    setSelectedTemplate(null);
    getTemplates({
      tenantId: user.tenantId,
      keyword: "",
      page: 1,
      limit: 999,
    })
      .then((res) => {
        if (res.result.total > 0) {
          setTemplates(res.result.templates);
          setSelectedTemplate(res.result.templates[0]);
        }
      })
      .catch((error) => {
        console.error(error);
        setError("Gagal memuat template. Silakan coba lagi.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-10 px-10"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
    >
      <div className="flex flex-row w-full justify-between items-center">
        <motion.img
          src={btnBackGold}
          alt="Back"
          whileTap={{ scale: 0.95 }}
          onClick={goBack}
          className="touch-target w-36 h-max select-none cursor-pointer"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          draggable={false}
        />
        <motion.img
          src={logoChooseFrame}
          alt="Voucher"
          className="w-96 h-28 select-none pointer-events-none"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          draggable={false}
        />
        <motion.img
          src={logoBack}
          alt="How To Use"
          className="w-36 h-max select-none pointer-events-none cursor-pointer invisible"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
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
                /* hide scrollbar visually but keep it functional */
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
                      "relative flex flex-col items-center rounded-2xl transition-all duration-300 select-none cursor-pointer focus:outline-none",
                      "w-max h-max",
                      "border-4",
                      isSelected
                        ? "border-retro-amber shadow-[0_0_28px_6px_rgba(212,160,23,0.55)] scale-125 z-10"
                        : "border-transparent hover:border-retro-amber/40 hover:scale-105",
                    ].join(" ")}
                  >
                    {/* Card image / placeholder */}
                    {t.displayUrl ? (
                      <img
                        src={t.displayUrl}
                        alt={`Template-${indx}`}
                        draggable={false}
                        className="h-80 w-auto max-w-[220px] object-cover rounded-xl pointer-events-none"
                      />
                    ) : (
                      <div className="h-80 w-44 bg-retro-cream/10 rounded-xl flex flex-col items-center justify-center gap-2">
                        <span className="text-retro-cream/30 font-body text-4xl">
                          ⬜
                        </span>
                        <span className="text-retro-cream/40 font-body text-sm">
                          {/* {t.slotCount} Slot */}
                          slot
                        </span>
                      </div>
                    )}
                    {/* Name label */}
                    {/* <p
                      className={[
                        "mt-3 font-body text-sm transition-colors duration-300",
                        isSelected ? "text-retro-amber" : "text-retro-cream/70",
                      ].join(" ")}
                    >
                      {`Template-${indx}`}
                    </p> */}
                    {/* Selected indicator dot */}
                    {isSelected && (
                      <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-retro-amber shadow-[0_0_6px_2px_rgba(212,160,23,0.7)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-row w-full justify-end items-center ">
        <motion.img
          key={"NEXT"}
          src={btnNextGold}
          alt={"NEXT"}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (selectedTemplate) {
              setTemplateInStore(selectedTemplate);
            }
            goNext();
          }}
          className="touch-target w-36 h-max select-none cursor-pointer transition-all"
          initial={{ rotate: 0, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          draggable={false}
        />
      </div>
    </motion.div>
  );
}
