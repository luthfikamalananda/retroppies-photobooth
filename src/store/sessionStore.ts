import { TransactionResult } from '@/services/paymentService'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SessionState {
  currentHalaman: number
  transaction: TransactionResult | null
  timerSeconds: number
  timerRunning: boolean
  consentGiven: boolean

  goTo: (halaman: number) => void
  goNext: () => void
  goBack: () => void
  setTransaction: (transaction: TransactionResult | null) => void
  setTransactionStatus: (status: TransactionResult['status']) => void
  setConsent: (value: boolean) => void
  startTimer: (durationSec: number) => void
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
      consentGiven: false,

      goTo: (halaman) => set({ currentHalaman: halaman }),
      goNext: () => set((s) => ({ currentHalaman: Math.min(s.currentHalaman + 1, 14) })),
      goBack: () => set((s) => ({ currentHalaman: Math.max(s.currentHalaman - 1, 1) })),
      setTransaction: (transaction) => set({ transaction }),
      setTransactionStatus: (status) =>
        set((s) => ({
          transaction: s.transaction ? { ...s.transaction, status } : null,
        })),
      setConsent: (value) => set({ consentGiven: value }),
      startTimer: (durationSec) => set({ timerSeconds: durationSec, timerRunning: true }),
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
          consentGiven: false,
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
        timerRunning: false,
        consentGiven: s.consentGiven,
      }),
    }
  )
)
