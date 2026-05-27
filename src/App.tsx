import { AnimatePresence } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { BackgroundVideo } from '@/components/Common/BackgroundVideo'
import { TopTimerBar } from '@/components/Common/TopTimerBar'
import { GlobalModalHost } from '@/components/Common/GlobalModalHost'
import { ToastHost } from '@/components/Common/ToastHost'
import { MockModeBadge } from '@/components/Common/MockModeBadge'

// Halaman components (lazy-loaded for performance)
import { lazy, Suspense } from 'react'

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
const FilterPage = lazy(() => import('@/components/PhotoSession/FilterPage').then(m => ({ default: m.FilterPage })))
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
  13: FilterPage,
  14: FinishedPhotoPage,
}

const TIMER_VISIBLE_HALAMAN = [9, 10, 11, 12, 13, 14]

export default function App() {
  const currentHalaman = useSessionStore(s => s.currentHalaman)

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
