import { AnimatePresence } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useAuthStore } from '@/store/authStore'
import { BackgroundVideo } from '@/components/Common/BackgroundVideo'
import { TopTimerBar } from '@/components/Common/TopTimerBar'
import { GlobalModalHost } from '@/components/Common/GlobalModalHost'
import { ToastHost } from '@/components/Common/ToastHost'
import { MockModeBadge } from '@/components/Common/MockModeBadge'

// Halaman components (lazy-loaded for performance)
import { lazy, Suspense, useEffect, useRef } from 'react'
import { useCartStore } from './store/cartStore'
import { usePhotoStore } from './store/photoStore'

const AdminLoginPage = lazy(() => import('@/components/Auth/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })))
const LandingPage = lazy(() => import('@/components/Onboarding/LandingPage').then(m => ({ default: m.LandingPage })))
const HowToUsePage = lazy(() => import('@/components/Onboarding/HowToUsePage').then(m => ({ default: m.HowToUsePage })))
const ProductPage = lazy(() => import('@/components/Product/ProductPage').then(m => ({ default: m.ProductPage })))
const ExtraPrintPage = lazy(() => import('@/components/Product/ExtraPrintPage').then(m => ({ default: m.ExtraPrintPage })))
const AddOnsPage = lazy(() => import('@/components/Product/AddOnsPage').then(m => ({ default: m.AddOnsPage })))
const VoucherPage = lazy(() => import('@/components/Product/VoucherPage').then(m => ({ default: m.VoucherPage })))
const PaymentPage = lazy(() => import('@/components/Payment/PaymentPage').then(m => ({ default: m.PaymentPage })))
const PaymentSuccessPage = lazy(() => import('@/components/Payment/PaymentSuccessPage').then(m => ({ default: m.PaymentSuccessPage })))
const StartPhotoPage = lazy(() => import('@/components/Payment/StartPhotoPage').then(m => ({ default: m.StartPhotoPage })))
const TakePhotoPage = lazy(() => import('@/components/PhotoSession/TakePhotoPage').then(m => ({ default: m.TakePhotoPage })))
const TemplatePage = lazy(() => import('@/components/PhotoSession/TemplatePage').then(m => ({ default: m.TemplatePage })))
const DragDropPage = lazy(() => import('@/components/PhotoSession/DragDropPage').then(m => ({ default: m.DragDropPage })))
const FinishedPhotoPage = lazy(() => import('@/components/PhotoSession/FinishedPhotoPage').then(m => ({ default: m.FinishedPhotoPage })))

const PAGE_COMPONENTS: Record<number, React.ComponentType> = {
  0: AdminLoginPage,
  1: LandingPage,
  2: HowToUsePage,
  3: ProductPage,
  4: ExtraPrintPage,
  5: AddOnsPage,
  6: VoucherPage,
  7: PaymentPage,
  8: PaymentSuccessPage,
  9: StartPhotoPage,
  10: TakePhotoPage,
  11: TemplatePage,
  12: DragDropPage,
  13: FinishedPhotoPage,
}

const TIMER_VISIBLE_HALAMAN = [10, 11, 12, 13]

// Protected halaman that require authentication
const PROTECTED_HALAMAN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

const MUSTHAVE_PRODUCTS = [4, 5, 6] // ProductPage and ExtraPrintPage require a valid productBundle to be selected

// const MUSHAVE_TRANSACTION_DATA = [8, 9, 10, 11, 12, 13] // Pages that require transaction data to be present (i.e. after payment success)

const RESET_SESSION = [0, 1, 2, 3, 4, 5, 6, 7]

export default function App() {
  const { goTo, resetSession, transaction, currentHalaman } = useSessionStore()
  const user = useAuthStore(s => s.user)
  const { clearPhotos } = usePhotoStore()

  const { productBundle } = useCartStore() // for cart persistence across halaman, if needed in the future

  // Check if current halaman is protected and user is not authenticated
  const isProtectedPage = PROTECTED_HALAMAN.includes(currentHalaman)
  const needsAuth = isProtectedPage && !user

  // If protected page but no auth, redirect to login
  if (needsAuth) {
    goTo(0)
  }

  // Check if current halaman requires a product bundle but it's not selected
  const isMustHaveProductPage = MUSTHAVE_PRODUCTS.includes(currentHalaman)
  const needsProductBundle = isMustHaveProductPage && !productBundle

  // If must-have product page but no product bundle, redirect to ProductPage
  if (needsProductBundle) {
    goTo(3) // ProductPage
  }

  // Check if current halaman requires transaction data but it's not present
  // const isMustHaveTransactionDataPage = MUSHAVE_TRANSACTION_DATA.includes(currentHalaman)
  // const needsTransactionData = isMustHaveTransactionDataPage && (transaction === null)

  // If must-have transaction data page but no transaction data, redirect to PaymentPage
  // if (needsTransactionData) {
  //   goTo(1) // Landing Page
  // }

  // Check if current halaman requires session reset
  const isMustResetSession = RESET_SESSION.includes(currentHalaman)
  // const isInitialized = useRef(false)
  const clearPhotoTrigger = async () => {
    await clearPhotos()
  }
  useEffect(() => {
    if (isMustResetSession) {
      resetSession()
      clearPhotoTrigger()
    }
  }, [currentHalaman])

  const PageComponent = PAGE_COMPONENTS[currentHalaman] ?? LandingPage
  const showTimer = TIMER_VISIBLE_HALAMAN.includes(currentHalaman)

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <BackgroundVideo />
      {showTimer && <TopTimerBar />}

      <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-retro-cream font-display text-4xl">Loading...</div>}>
        <AnimatePresence mode="wait">
          <PageComponent key={currentHalaman} />
        </AnimatePresence>
      </Suspense>

      <GlobalModalHost />
      <ToastHost />
      <MockModeBadge />
    </div>
  )
}
