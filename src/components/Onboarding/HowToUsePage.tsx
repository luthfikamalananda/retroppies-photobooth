import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import logoRec from '@/assets/logo-rec.svg'
import logoBattery from '@/assets/logo-battery.svg'
import logoHowToUse from '@/assets/logo-how-to-use.svg'
import howToUse1 from '@/assets/how-to-use-1.svg'
import howToUse2 from '@/assets/how-to-use-2.svg'
import howToUse3 from '@/assets/how-to-use-3.svg'
import howToUse4 from '@/assets/how-to-use-4.svg'
import howToUse5 from '@/assets/how-to-use-5.svg'
import howToUse6 from '@/assets/how-to-use-6.svg'
import howToUse7 from '@/assets/how-to-use-7.svg'
import { useEffect, useState } from 'react'
import { logoSkip } from '@/assets'
import { useUIStore } from '@/store/uiStore'

const STEPS = [
  { title: 'Choose Product', img: howToUse1 },
  { title: 'Scan QRIS', img: howToUse2 },
  { title: 'Enter Voucher', img: howToUse3 },
  { title: 'Payment Success', img: howToUse4 },
  { title: 'Start Session', img: howToUse5 },
  { title: 'Select Frame & Filter', img: howToUse6 },
  { title: 'Print & Download', img: howToUse7 },
]

export function HowToUsePage() {
  const { goNext, goBack, setTransaction } = useSessionStore()
  const [isTitleVisible, setTitleVisible] = useState(false)
  const setBg = useUIStore((s) => s.setBackgroundVariant)


  useEffect(() => {
    setTransaction(null) // reset transaksi saat masuk halaman ini
    setBg('image-black')
    return () => setBg('video-black') // restore saat halaman ini ditinggalkan
  }, [])

  useEffect(() => {
    setTransaction(null) // reset transaksi saat masuk halaman ini
  }, [])

  return (
    <motion.div
      className="relative z-10 flex flex-col w-full h-full py-12 px-14 gap-10"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
    >
      {/* HEADER */}
      <div className="w-full flex justify-between items-center flex-shrink-0">
        <motion.img
          src={logoRec}
          alt="Play"
          className="w-40 h-20 select-none pointer-events-none"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          draggable={false}
        />
        <motion.img
          src={logoHowToUse}
          alt="How To Use"
          className="w-[650px] h-[200px] select-none pointer-events-none"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onAnimationComplete={() => setTitleVisible(true)}
          draggable={false}
        />
        <motion.img
          src={logoBattery}
          alt="Battery"
          className="w-20 h-20 select-none pointer-events-none"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          draggable={false}
        />
      </div>

      {/* CONTENT */}
      <div className="flex-1 flex items-center justify-center w-full min-h-0">
        <div className="grid grid-cols-4 gap-12 w-full gap-y-24">
          {isTitleVisible && STEPS.map((step, i) => (
            <motion.div
              key={i}
              className="flex flex-col items-center justify-center p-2 min-h-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 * i }}
            >
              <img src={step.img} alt={step.title} className="max-h-96 w-auto object-contain rounded-lg" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex-0 flex items-center justify-end w-full ">
        <motion.img
          src={logoSkip}
          alt="Skip Button"
          onClick={goNext}
          className="w-48 h-max cursor-pointer flex gap-4 justify-end flex-shrink-0"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          draggable={false}
        />
      </div>
    </motion.div>
  )
}
