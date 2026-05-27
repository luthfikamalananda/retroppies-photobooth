import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface UIState {
  loading: Record<string, boolean>
  errors: Record<string, string | null>
  modalOpen: boolean
  modalContent: React.ReactNode | null
  toasts: Toast[]

  setLoading: (key: string, value: boolean) => void
  setError: (key: string, message: string | null) => void
  openModal: (content: React.ReactNode) => void
  closeModal: () => void
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  loading: {},
  errors: {},
  modalOpen: false,
  modalContent: null,
  toasts: [],

  setLoading: (key, value) =>
    set((s) => ({ loading: { ...s.loading, [key]: value } })),

  setError: (key, message) =>
    set((s) => ({ errors: { ...s.errors, [key]: message } })),

  openModal: (content) => set({ modalOpen: true, modalContent: content }),

  closeModal: () => set({ modalOpen: false, modalContent: null }),

  addToast: (message, type = 'info') =>
    set((s) => ({
      toasts: [...s.toasts, { id: Date.now().toString(), message, type }],
    })),

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))
