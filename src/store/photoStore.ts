import { create } from 'zustand'

export interface CapturedPhoto {
  slotIndex: number
  dataUrl: string
  capturedAt: number
}

export interface CapturedVideo {
  slotIndex: number
  videoBlob: Blob
  recordedAt: number
}

interface PhotoState {
  captures: CapturedPhoto[]
  capturesVideo: CapturedVideo[]
  totalSlots: number

  addCapture: (photo: CapturedPhoto) => void
  addVideoCapture: (video: CapturedVideo) => void
  retakeSlot: (slotIndex: number) => void
  retakeVideoSlot: (slotIndex: number) => void
  setTotalSlots: (count: number) => void
  clearPhotos: () => void
  isComplete: () => boolean
}

export const usePhotoStore = create<PhotoState>((set, get) => ({
  captures: [],
  capturesVideo: [],
  totalSlots: 4,

  addCapture: (photo) => {
    const { captures } = get()
    const updated = captures.filter(c => c.slotIndex !== photo.slotIndex)
    set({ captures: [...updated, photo] })
  },

  addVideoCapture: (video) => {
    const { capturesVideo } = get()
    const updated = capturesVideo.filter(v => v.slotIndex !== video.slotIndex)
    set({ capturesVideo: [...updated, video] })
  },

  retakeSlot: (slotIndex) => {
    set((s) => ({ captures: s.captures.filter(c => c.slotIndex !== slotIndex) }))
  },

  retakeVideoSlot: (slotIndex) => {
    set((s) => ({ capturesVideo: s.capturesVideo.filter(v => v.slotIndex !== slotIndex) }))
  },

  setTotalSlots: (count) => set({ totalSlots: count }),

  clearPhotos: () => set({ captures: [], capturesVideo: [] }),

  isComplete: () => {
    const { captures, totalSlots } = get()
    return captures.length >= totalSlots
  },
}))
