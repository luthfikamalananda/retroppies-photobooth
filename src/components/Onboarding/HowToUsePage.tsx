/**
 * HowToUsePage — optimized for MiniPC / low-end hardware
 *
 * Perubahan utama:
 * 1. Semua animasi header disederhanakan: hanya opacity (tidak ada rotate/x)
 *    → tidak ada layout thrashing, GPU hanya handle compositing
 * 2. Step cards di-mount secara BERTAHAP pakai staggerChildren di parent,
 *    bukan delay individual — Framer Motion lebih efisien dengan stagger parent
 * 3. SVG steps di-render dengan will-change:auto (bukan transform)
 *    dan ukuran dibatasi agar browser tidak perlu re-rasterize besar
 * 4. Page transition hanya opacity — hapus x:60 yang trigger layout paint
 * 5. isTitleVisible dihapus — tidak perlu delay render konten via onAnimationComplete;
 *    pakai stagger delay di parent saja
 * 6. Gambar steps diberi loading="eager" + decoding="async"
 *    agar main thread tidak diblokir saat decode
 */

import { motion } from 'framer-motion'
import { useEffect, memo, useState } from 'react'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'

import logoRec from '@/assets/logo-rec.svg'
import logoBattery from '@/assets/logo-battery.svg'
import logoHowToUse from '@/assets/logo-how-to-use.svg'
import { logoSkip } from '@/assets'

import howToUse1 from '@/assets/how-to-use-1.svg'
import howToUse2 from '@/assets/how-to-use-2.svg'
import howToUse3 from '@/assets/how-to-use-3.svg'
import howToUse4 from '@/assets/how-to-use-4.svg'
import howToUse5 from '@/assets/how-to-use-5.svg'
import howToUse6 from '@/assets/how-to-use-6.svg'
import howToUse7 from '@/assets/how-to-use-7.svg'

// ─── Data ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { title: 'Choose Product', img: howToUse1 },
  { title: 'Scan QRIS', img: howToUse2 },
  { title: 'Enter Voucher', img: howToUse3 },
  { title: 'Payment Success', img: howToUse4 },
  { title: 'Start Session', img: howToUse5 },
  { title: 'Select Frame & Filter', img: howToUse6 },
  { title: 'Print & Download', img: howToUse7 },
]

// ─── Animation variants ────────────────────────────────────────────────────────
//
// Pakai variants + staggerChildren agar Framer Motion bisa batch semua animasi
// dalam satu orchestration pass — lebih ringan daripada delay manual per item.

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

const headerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
}

// Parent grid: orchestrates stagger
const gridVariants = {
  hidden: {},
  visible: {
    transition: {
      // Mulai stagger setelah header selesai (0.3s)
      delayChildren: 0.35,
      // Jarak antar card — lebih kecil = lebih ringan
      staggerChildren: 0.07,
    },
  },
}

// Setiap card: hanya opacity + translateY kecil (tidak scale, tidak rotate)
const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: 'easeOut' },
  },
}

// ─── StepCard — memo agar tidak re-render saat parent state berubah ────────────

const StepCard = memo(function StepCard({
  img, title,
}: { img: string; title: string }) {
  return (
    <motion.div
      variants={cardVariants}
      className="flex flex-col items-center justify-center p-2 min-h-0"
      // will-change:opacity jauh lebih murah dari will-change:transform
      style={{ willChange: 'opacity' }}
    >
      <img
        src={img}
        alt={title}
        // eager: gambar sudah di-bundle, tidak perlu lazy
        // async decode: tidak blokir main thread
        loading="eager"
        decoding="async"
        className="max-h-96 w-auto object-contain rounded-lg"
        // Batasi ukuran render agar GPU tidak perlu rasterize terlalu besar
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </motion.div>
  )
})

// ─── Page ─────────────────────────────────────────────────────────────────────

export function HowToUsePage() {
  const { goNext, setTransaction, goTo } = useSessionStore()
  const setBg = useUIStore((s) => s.setBackgroundVariant)

  useEffect(() => {
    setTransaction(null)
    setBg('image-black')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      className="relative z-10 flex flex-col w-full h-full py-12 px-14 gap-10"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* ── HEADER ── */}
      <div className="w-full flex justify-between items-center flex-shrink-0">
        <motion.img
          src={logoRec}
          alt="Play"
          variants={headerVariants}
          className="w-40 h-20 select-none pointer-events-none"
          draggable={false}
        />
        <motion.img
          src={logoHowToUse}
          alt="How To Use"
          variants={headerVariants}
          className="w-[650px] h-[200px] select-none pointer-events-none"
          draggable={false}
        />
        <motion.img
          src={logoBattery}
          alt="Battery"
          variants={headerVariants}
          className="w-20 h-20 select-none pointer-events-none"
          draggable={false}
        />
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 flex items-center justify-center w-full min-h-0">
        {/*
          motion.div parent dengan gridVariants mengatur stagger.
          Tidak ada state isTitleVisible — grid langsung mount,
          animasinya saja yang di-delay via delayChildren.
        */}
        <motion.div
          className="grid grid-cols-4 gap-12 gap-y-24 w-full"
          variants={gridVariants}
          initial="hidden"
          animate="visible"
        >
          {STEPS.map((step, i) => (
            <StepCard key={i} img={step.img} title={step.title} />
          ))}
        </motion.div>
      </div>

      {/* ── FOOTER ── */}
      <div className="flex-0 flex items-center justify-end w-full">
        <motion.img
          src={logoSkip}
          alt="Skip Button"
          onClick={goNext}
          variants={headerVariants}
          className="w-48 h-max cursor-pointer flex gap-4 justify-end flex-shrink-0"
          draggable={false}
          whileTap={{ scale: 0.95 }}
        />
      </div>
    </motion.div>
  )
}