import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useCartStore } from '@/store/cartStore'
import { useUIStore } from '@/store/uiStore'
import { logoBatteryAlt, logoFailed, logoRecAlt, logoSuccess } from '@/assets'

export function PaymentSuccessPage() {
    const goTo = useSessionStore(s => s.goTo)

    const { transaction, setTransaction } = useSessionStore() // untuk reset session jika diperlukan di masa depan

    const setBg = useUIStore((s) => s.setBackgroundVariant)

    useEffect(() => {
        setBg('image-white')
        return () => setBg('video-black') // restore saat halaman ini ditinggalkan
    }, [])

    useEffect(() => {
        if (transaction && transaction.status === "SUCCESS") {
            const t = setTimeout(() => {
                goTo(9)
            }, 2500)
            return () => clearTimeout(t)
        }
        else if (transaction && transaction.status === "FAILED") {
            const t = setTimeout(() => {
                setTransaction(null)
                goTo(7)
            }, 2500)
            return () => clearTimeout(t)
        }
    }, [goTo, transaction])


    if (!transaction || transaction.status === "PENDING") {
        return (
            <></>
        )
    }

    return (
        <motion.div
            className="relative z-10 flex flex-col w-full h-full py-12 px-14 gap-10 justify-center items-center"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
        >
            <div className="w-full flex justify-between items-center flex-shrink-0">
                <motion.img
                    src={logoRecAlt}
                    alt="Play"
                    className="w-48 h-24 select-none pointer-events-none"
                    initial={{ rotate: -20, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    draggable={false}
                />
                <motion.img
                    src={logoBatteryAlt}
                    alt="Battery"
                    className="w-48 h-24 select-none pointer-events-none"
                    initial={{ rotate: -20, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    draggable={false}
                />
            </div>


            <div className='flex flex-1 w-full h-full justify-center items-center'>
                <motion.div
                    className="bg-[#1C1B1F] w-[45%] h-[80%] flex flex-col items-center justify-center gap-28 px-12 rounded-[72px]"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                >
                    {transaction.status === "FAILED" &&
                        <>
                            <h2 className="font-gaming text-[#FCF8EF] text-5xl text-center">PAYMENT FAILED !</h2>
                            <img src={logoFailed} alt="Failed" className="w-80 h-80" />
                        </>
                    }
                    {transaction.status === "SUCCESS" &&
                        <>
                            <h2 className="font-gaming text-[#FCF8EF] text-5xl text-center">PAYMENT SUCCESSFUL !</h2>
                            <img src={logoSuccess} alt="Success" className="w-80 h-80" />
                        </>
                    }
                </motion.div>
            </div>

        </motion.div >
    )

}
