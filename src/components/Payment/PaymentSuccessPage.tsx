import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'

export function PaymentSuccessPage() {
    const goTo = useSessionStore(s => s.goTo)

    useEffect(() => {
        const t = setTimeout(() => goTo(9), 2500)
        return () => clearTimeout(t)
    }, [goTo])

    return (
        <motion.div
            className="relative z-10 flex flex-col items-center justify-center w-full h-full gap-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="text-8xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
            >
                ✅
            </motion.div>
            <h2 className="font-display text-retro-cream text-5xl text-center">Pembayaran Berhasil!</h2>
            <p className="font-body text-retro-cream/60">Bersiap untuk sesi foto...</p>
        </motion.div>
    )
}
