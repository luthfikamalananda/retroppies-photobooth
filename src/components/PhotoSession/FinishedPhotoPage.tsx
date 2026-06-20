import { btnNextBlack, iconChecklist, logoWindowControl, logoWindowControlWhite } from '@/assets'
import { sendInvoice } from '@/services/emailService'
import { getSessionResult, getSesssions, sendEmail } from '@/services/finalizeService'
import { printPhoto, printPhotoBorderless } from '@/services/printService'
import { usePhotoStore } from '@/store/photoStore'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import { AnimatePresence, motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'

function EmailSentModal({
  isOpen,
  setIsOpen,
  message
}: {
  isOpen: boolean
  setIsOpen: (value: React.SetStateAction<{
    isOpen: boolean;
    message: string;
  }>) => void
  message: string
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsOpen((prev) => {
            return {
              ...prev,
              isOpen: false
            }
          })}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-xl border-4 border-[#F7CC40] shadow-2xl overflow-hidden w-[600px]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#F7CC40] px-5 py-4 flex items-center justify-between">
              <h2 className="font-gaming text-[#2C2C2C] text-2xl">EMAIL SENT</h2>
              <img src={logoWindowControl} alt="Window-Control" className="select-none pointer-events-none h-auto" />
            </div>

            {/* Content */}
            <div className="bg-[#FCF8EF] px-8 pt-8 pb-6 flex flex-col gap-6">
              <p className="font-gaming text-[#2C2C2C] text-xl text-center">
                {message}
              </p>

              {/* Buttons */}
              <div className="flex gap-4 justify-center mt-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsOpen((prev) => {
                    return {
                      ...prev,
                      isOpen: false
                    }
                  })}
                  className="flex-1 bg-[#4CAF50] hover:bg-[#45a049] text-white font-gaming text-lg py-3 px-6 rounded-lg border-2 border-[#2E7D32] transition-colors"
                >
                  Close
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function FinishedPhotoPage() {
  const { sessionCode, resetSession } = useSessionStore()
  const { templateWithPhotoProduction, templateWithPhoto, clearPhotos } = usePhotoStore()

  const [sessionValue, setSessionValue] = useState<getSessionResult | null>(null)

  const [openEmailSentModal, setOpenEmailSentModal] = useState({
    isOpen: false,
    message: ''
  })

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<{
    isError: boolean,
    errorMsg: string
  }>({
    isError: true,
    errorMsg: ''
  })

  const [isProcessing, setIsProcessing] = useState(false)

  const [loading, setLoading] = useState(false)


  const setBg = useUIStore((s) => s.setBackgroundVariant);

  useEffect(() => {
    setBg("image-white");
    return () => setBg("video-black");
  }, []);


  let isInitialized = false; // flag untuk memastikan init hanya sekali

  useEffect(() => {
    if (isInitialized) return
    isInitialized = true

    if (sessionCode) {
      getSesssions(sessionCode)
        .then((res) => {
          if (res.result) {
            setSessionValue(res.result)
          } else {
            // setError('Gagal memuat foto. Coba lagi.')
          }
        })
        .catch((e) => {
          console.error(e)
          // setError('Gagal memuat foto. Coba lagi.')
        })
        .finally(() => setLoading(false))
    }

  }, [sessionCode])

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const value = e.target.value;
    setEmail(value);

    if (!value) {
      setEmailError({
        isError: true,
        errorMsg: 'Email is required'
      });
    } else if (!emailRegex.test(value)) {
      setEmailError({
        isError: true,
        errorMsg: 'Please enter a valid email address'
      });
    } else {
      setEmailError({
        isError: false,
        errorMsg: ''
      });
    }
  };

  // const handleSendEmail = async () => {
  //   setIsProcessing(true)
  //   try {
  //     const result = await sendEmail({
  //       customerEmail: email,
  //       invoiceNumber: sessionValue?.invoiceNumber || '',
  //     })
  //     if (result.success) {
  //       setOpenEmailSentModal({
  //         isOpen: true,
  //         message: result.message
  //       })
  //       try {
  //         await printPhoto(templateWithPhotoProduction)
  //       } catch (printErr) {
  //         console.error('Print gagal:', printErr)
  //         // Tetap navigasi meski print gagal
  //       }
  //     }
  //   } catch (error) {
  //     console.log('error', error)
  //   } finally {
  //     setIsProcessing(false)
  //     // HARDCODE
  //     setOpenEmailSentModal({
  //       isOpen: true,
  //       message: `email berhasil dikirim ke ${email}`
  //     })
  //   }
  // }

  const handleSendEmail = async () => {
    try {
      // await printPhoto(templateWithPhotoProduction)
      await printPhotoBorderless(templateWithPhotoProduction)
    } catch (printErr) {
      console.error('Print gagal:', printErr)
      // Tetap navigasi meski print gagal
    }
  }


  return (
    <>
      <motion.div
        className="relative z-10 flex flex-col items-center justify-between w-full h-full py-8 px-10 gap-4"
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -60 }}
      >
        {/* ── Header row ── */}
        <div className="flex flex-row w-full justify-between items-center flex-shrink-0 mb-2">
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="touch-target w-36 h-max select-none cursor-pointer"
          />
        </div>

        {/* ── Main content: template preview + photo tray ── */}
        <div className="flex-1 flex flex-row items-center justify-center w-full gap-20 px-28 h-full">
          {/* Left */}
          <div className='flex flex-col gap-4 items-center w-max h-full justify-center'>
            <img src={sessionValue?.photo1Url} alt="TemplatedPhoto" className='h-[75%] object-fill' />
            {(openEmailSentModal.message === '') &&
              (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className={[
                    'touch-target h-max w-full select-none font-gaming text-[#FDFDFD] px-4 py-2 rounded-full text-nowrap bg-[#1C1B1F] cursor-pointer ',
                    emailError.isError || emailError.errorMsg !== '' || email === '' ? 'bg-gray-400' : 'opacity-100'
                  ].join('')}
                  onClick={handleSendEmail}
                // disabled={email === '' || (emailError.isError && emailError.errorMsg === '')}
                >
                  FINISH & PRINT
                </motion.button>
              )}
            {(openEmailSentModal.isOpen === false && openEmailSentModal.message !== '') &&
              (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className={[
                    'touch-target h-max w-full select-none font-gaming text-[#FDFDFD] px-4 py-2 rounded-full text-nowrap bg-[#1C1B1F] cursor-pointer ',
                    emailError.isError || emailError.errorMsg !== '' || email === '' ? 'bg-gray-400' : 'opacity-100'
                  ].join('')}
                  onClick={async () => {
                    await clearPhotos()
                    resetSession()
                  }}
                >
                  BACK TO HOME
                </motion.button>
              )}
          </div>
          {/* Right */}
          <div className='w-1/2 rounded-xl border-4 border-[#B23E3E]'>
            {/* Header */}
            <div className="bg-[#B23E3E] px-5 py-4 flex items-center justify-between">
              <h2 className="font-gaming text-[#FCF8EF] text-2xl">DOWNLOAD FILE HERE</h2>
              <img src={logoWindowControlWhite} alt="Window-Control" className="select-none pointer-events-none h-auto " />
            </div>

            {/* Content */}
            <div className="bg-[#FCF8EF] px-8 py-8 flex flex-col gap-6 items-center w-full rounded-b-xl ">
              {sessionValue?.qrCodePath && (
                <QRCodeSVG
                  value={sessionValue?.qrCodePath}
                  size={200}
                  level="H"
                />
              )}

              <div className='w-full h-1 bg-[#F8E6E6]' />

              <div className="w-full flex flex-col gap-4">
                <div className='flex flex-row '>
                  <label htmlFor="email" className="font-gaming text-[#575757] text-lg text-center">ENTER EMAIL</label>
                  <label htmlFor="email" className="font-gaming text-[#B23E3E] text-lg text-center">* (WAJIB DIISI)</label>
                </div>
                <div className='flex flex-row gap-2 items-center relative w-full'>
                  <input type="email" id="email" value={email} onChange={handleEmailChange} className="font-body text-[#575757] text-lg text-left border-2 border-[#B23E3E] rounded-lg px-4 py-2 w-full" />
                  {!emailError.isError && emailError.errorMsg === '' && (
                    <motion.img
                      src={iconChecklist}
                      alt="checklist"
                      className='absolute right-4'
                    />
                  )}
                </div>
                {(emailError.isError && emailError.errorMsg !== '') && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className='flex flex-row gap-2 items-center'>
                      <p className='font-body text-[#B23E3E] text-lg'>{emailError.errorMsg}</p>
                    </div>
                  </motion.div>
                )}
              </div>
              <p className="font-gaming text-[#575757] text-lg text-center">YOUR INVOICE & DOWNLOAD LINK WILL BE SENT AUTOMATICALLY ✨</p>
            </div>
          </div>
        </div>

        {/* ── Footer row ── */}
        <div className="flex flex-row w-full justify-end items-center flex-shrink-0 invisible">
          <AnimatePresence>
            <motion.img
              key="NEXT"
              src={btnNextBlack}
              alt="NEXT"
              whileTap={{ scale: 0.95 }}
              className="touch-target w-36 h-max select-none cursor-pointer"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              draggable={false}
            />
          </AnimatePresence>
        </div>
      </motion.div >

      {/* Loading overlay */}
      <AnimatePresence>
        {
          isProcessing && (
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
          )
        }
      </AnimatePresence >

      <EmailSentModal
        isOpen={openEmailSentModal.isOpen}
        setIsOpen={setOpenEmailSentModal}
        message={openEmailSentModal.message}
      />
    </>
  )
}
