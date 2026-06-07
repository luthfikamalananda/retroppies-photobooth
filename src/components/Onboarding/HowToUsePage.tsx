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
      className="relative z-10 flex flex-col w-full h-full py-6 px-8 gap-4"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
    >
      <div className="w-full flex justify-between items-center flex-shrink-0">
        <motion.img
          src={logoRec}
          alt="Play"
          className="w-32 h-16 select-none pointer-events-none"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          draggable={false}
        />
        <motion.img
          src={logoHowToUse}
          alt="How To Use"
          className="w-96 h-28 select-none pointer-events-none"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onAnimationComplete={() => setTitleVisible(true)}
          draggable={false}
        />
        <motion.img
          src={logoBattery}
          alt="Battery"
          className="w-14 h-14 select-none pointer-events-none"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          draggable={false}
        />
      </div>

      <div className="grid grid-cols-4 gap-4 w-full flex-1 auto-rows-fr overflow-hidden">
        {isTitleVisible && STEPS.map((step, i) => (
          <motion.div
            key={i}
            // className="bg-black/50 border border-retro-amber/30 rounded-xl p-6 flex flex-col items-center gap-3 text-center"
            className="rounded-xl p-4 flex flex-col items-center gap-2 text-center min-h-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 * i }}
          >
            <img src={step.img} alt={step.title} className="w-full h-full object-contain rounded-lg" />
          </motion.div>
        ))}
      </div>

      {/* <div className="flex gap-4 w-full justify-end flex-shrink-0 fixed bottom-4 right-0"> */}
      <motion.img
        src={logoSkip}
        alt="Skip Button"
        onClick={goNext}
        className="w-36 h-max cursor-pointer flex gap-4 justify-end flex-shrink-0 fixed bottom-4 right-6"
        initial={{ rotate: -20, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        draggable={false}
      />
      {/* </div> */}
    </motion.div>
  )
}
