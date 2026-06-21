import { TransactionResult } from '@/services/paymentService'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SessionState {
  currentHalaman: number
  transaction: TransactionResult | null
  sessionCode: string | null
  timerSeconds: number
  timerRunning: boolean
  autoSubmit: boolean

  goTo: (halaman: number) => void
  goNext: () => void
  goBack: () => void
  goToAndStartTimer: (halaman: number) => void
  setTransaction: (transaction: TransactionResult | null) => void
  setTransactionStatus: (status: TransactionResult['status']) => void
  setTimer: (durationSec: number) => void
  setSessionCode: (code: string) => void
  startTimer: () => void
  tickTimer: () => void
  stopTimer: () => void
  setAutoSubmit: (autoSubmit: boolean) => void
  resetSession: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      currentHalaman: 1,
      transaction: null,
      sessionCode: null,
      timerSeconds: 0,
      timerRunning: false,
      autoSubmit: false,

      goTo: (halaman) => set({ currentHalaman: halaman }),
      goNext: () => set((s) => ({ currentHalaman: Math.min(s.currentHalaman + 1, 14) })),
      goBack: () => set((s) => ({ currentHalaman: Math.max(s.currentHalaman - 1, 1) })),
      goToAndStartTimer: (halaman) => set({ currentHalaman: halaman, timerRunning: true }),
      setTransaction: (transaction) => set({ transaction }),
      setTransactionStatus: (status) =>
        set((s) => ({
          transaction: s.transaction ? { ...s.transaction, status } : null,
        })),
      setTimer: (durationSec) => set({ timerSeconds: durationSec, timerRunning: false }),
      startTimer: () => set({ timerRunning: true }),
      tickTimer: () => {
        const { timerSeconds } = get()
        if (timerSeconds <= 0) {
          set({ timerRunning: false, timerSeconds: 0 })
        } else {
          set({ timerSeconds: timerSeconds - 1 })
        }
      },
      setSessionCode: (code: string | null) => set({ sessionCode: code }),
      stopTimer: () => set({ timerRunning: false }),
      setAutoSubmit: (autoSubmit) => set({ autoSubmit }),
      resetSession: () =>
        set({
          transaction: null,
          sessionCode: null,
          timerSeconds: 0,
          timerRunning: false,
          autoSubmit: false,
        }),
    }),
    {
      name: 'retroppies-session',
      storage: createJSONStorage(() => sessionStorage),
      // timerRunning is intentionally excluded — resuming a running timer
      // after a page reload would be incorrect (the tick interval is gone).
      partialize: (s) => ({
        currentHalaman: s.currentHalaman,
        transaction: s.transaction,
        sessionCode: s.sessionCode,
        timerSeconds: s.timerSeconds,
        timerRunning: s.timerRunning,
        autoSubmit: s.autoSubmit,
      }),
    }
  )
)
