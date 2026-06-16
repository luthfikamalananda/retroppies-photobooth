import { TransactionResult } from '@/services/paymentService'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SessionState {
  currentHalaman: number
  transaction: TransactionResult | null
  timerSeconds: number
  timerRunning: boolean

  goTo: (halaman: number) => void
  goNext: () => void
  goBack: () => void
  goToAndStartTimer: (halaman: number) => void
  setTransaction: (transaction: TransactionResult | null) => void
  setTransactionStatus: (status: TransactionResult['status']) => void
  setTimer: (durationSec: number) => void
  startTimer: () => void
  tickTimer: () => void
  stopTimer: () => void
  resetSession: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      currentHalaman: 0,
      transaction: null,
      timerSeconds: 0,
      timerRunning: false,

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
      stopTimer: () => set({ timerRunning: false }),
      resetSession: () =>
        set({
          currentHalaman: 1,
          transaction: null,
          timerSeconds: 0,
          timerRunning: false,
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
        timerSeconds: s.timerSeconds,
        timerRunning: s.timerRunning,
      }),
    }
  )
)
