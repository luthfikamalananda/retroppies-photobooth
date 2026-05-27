import { create } from 'zustand'

export interface CapturedPhoto {
  slotIndex: number
  dataUrl: string
  capturedAt: number
}

interface PhotoState {
  captures: CapturedPhoto[]
  totalSlots: number

  addCapture: (photo: CapturedPhoto) => void
  retakeSlot: (slotIndex: number) => void
  setTotalSlots: (count: number) => void
  clearPhotos: () => void
  isComplete: () => boolean
}

export const usePhotoStore = create<PhotoState>((set, get) => ({
  captures: [],
  totalSlots: 4,

  addCapture: (photo) => {
    const { captures } = get()
    const updated = captures.filter(c => c.slotIndex !== photo.slotIndex)
    set({ captures: [...updated, photo] })
  },

  retakeSlot: (slotIndex) => {
    set((s) => ({ captures: s.captures.filter(c => c.slotIndex !== slotIndex) }))
  },

  setTotalSlots: (count) => set({ totalSlots: count }),

  clearPhotos: () => set({ captures: [] }),

  isComplete: () => {
    const { captures, totalSlots } = get()
    return captures.length >= totalSlots
  },
}))
