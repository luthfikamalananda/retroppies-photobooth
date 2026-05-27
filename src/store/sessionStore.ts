import { create } from 'zustand'

interface SessionState {
  currentHalaman: number
  transactionId: string | null
  timerSeconds: number
  timerRunning: boolean
  consentGiven: boolean

  goTo: (halaman: number) => void
  goNext: () => void
  goBack: () => void
  setTransactionId: (id: string) => void
  setConsent: (value: boolean) => void
  startTimer: (durationSec: number) => void
  tickTimer: () => void
  stopTimer: () => void
  resetSession: () => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  currentHalaman: 0,
  transactionId: null,
  timerSeconds: 0,
  timerRunning: false,
  consentGiven: false,

  goTo: (halaman) => set({ currentHalaman: halaman }),
  goNext: () => set((s) => ({ currentHalaman: Math.min(s.currentHalaman + 1, 14) })),
  goBack: () => set((s) => ({ currentHalaman: Math.max(s.currentHalaman - 1, 1) })),
  setTransactionId: (id) => set({ transactionId: id }),
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
      transactionId: null,
      timerSeconds: 0,
      timerRunning: false,
      consentGiven: false,
    }),
}))
