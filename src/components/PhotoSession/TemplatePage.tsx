import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useLayoutStore } from '@/store/layoutStore'
import { getTemplates } from '@/services/templateService'
import type { TemplateInfo } from '@/store/layoutStore'

export function TemplatePage() {
  const { goNext, goBack } = useSessionStore()
  const { selectedTemplate, setTemplate } = useLayoutStore()
  const [templates, setTemplates] = useState<TemplateInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTemplates().then(setTemplates).finally(() => setLoading(false))
  }, [])

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-10 px-10"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
    >
      <h2 className="font-display text-retro-cream text-5xl">Pilih Template</h2>

      <div className="flex-1 flex items-center justify-center w-full">
        {loading && <p className="font-body text-retro-cream/60 text-xl">Memuat template...</p>}
        {!loading && (
          <div className="flex gap-6 flex-wrap justify-center">
            {templates.map(t => (
              <button
                key={t.id}
                className={`touch-target flex flex-col gap-3 items-center border-2 rounded-2xl p-4 transition-all ${selectedTemplate?.id === t.id ? 'border-retro-amber scale-105' : 'border-retro-amber/20 hover:border-retro-amber/50'}`}
                onClick={() => setTemplate(t)}
              >
                {t.thumbnailUrl
                  ? <img src={t.thumbnailUrl} alt={t.name} className="w-32 h-40 object-cover rounded-lg" />
                  : <div className="w-32 h-40 bg-black/40 rounded-lg flex items-center justify-center text-retro-cream/30 font-body text-xs">{t.slotCount} Slot</div>
                }
                <p className="font-body text-retro-cream text-sm">{t.name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4 justify-center">
        <button className="touch-target px-10 py-4 border border-retro-amber/50 text-retro-cream font-body rounded-full" onClick={goBack}>← Kembali</button>
        <button
          className="touch-target px-10 py-4 bg-retro-amber text-retro-brown font-body font-semibold rounded-full disabled:opacity-40"
          disabled={!selectedTemplate}
          onClick={goNext}
        >
          Lanjut →
        </button>
      </div>
    </motion.div>
  )
}
