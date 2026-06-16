import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import { PersistStorage, StorageValue } from 'zustand/middleware'
import { Template } from '@/services/templateService';
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PhotoState {
  captures: CapturedPhoto[];
  capturesVideo: CapturedVideo[];
  template: Template | null;
  totalSlots: number;
  templateWithPhoto: any
  templateWithPhotoProduction: any
  templateWithVideo: any
  capturesToGIF: any

  addCapture: (photo: CapturedPhoto) => void;
  addVideoCapture: (video: CapturedVideo) => void;
  setTemplate: (template: Template) => void;
  retakeSlot: (slotIndex: number) => void;
  retakeVideoSlot: (slotIndex: number) => void;
  setTotalSlots: (count: number) => void;
  setTemplateWithPhoto: (data: any) => void;
  setTemplateWithPhotoProduction: (data: any) => void;
  setTemplateWithVideo: (data: any) => void;
  setCapturesToGIF: (data: any) => void;
  clearPhotos: () => Promise<void>;
  isComplete: () => boolean;

  setTemplateAndGif: (data: {
    templateWithPhoto: any;
    templateWithPhotoProduction: any;
    templateWithVideo: any;
    capturesToGIF: any;
  }) => void;
}


export interface CapturedPhoto {
  slotIndex: number;
  dataUrl: string;
  capturedAt: number;
}

export interface CapturedVideo {
  slotIndex: number;
  videoBlob: Blob;
  recordedAt: number;
}

// Gunakan PersistStorage bukan StateStorage agar bisa handle object langsung
const indexedDBStorage: PersistStorage<Partial<PhotoState>> = {
  getItem: async (name): Promise<StorageValue<Partial<PhotoState>> | null> => {
    const value = await idbGet<StorageValue<Partial<PhotoState>>>(name)
    return value ?? null
  },
  setItem: async (name, value: StorageValue<Partial<PhotoState>>) => {
    // IndexedDB structured clone → Blob tersimpan native tanpa konversi apapun
    await idbSet(name, value)
  },
  removeItem: async (name) => {
    await idbDel(name)
  },
}

export const usePhotoStore = create<PhotoState>()(
  persist(
    (set, get) => ({
      captures: [], // 4 Photo Raw
      capturesVideo: [], // 4 Video Raw
      template: null, // Template Raw
      totalSlots: 1, // Jumlah Slot (Auto untuk 4 foto/video, 1 untuk strip)
      templateWithPhoto: null, // Template yang di inject dengan foto + video
      templateWithPhotoProduction: null,
      templateWithVideo: null, // Template yang di inject dengan video
      capturesToGIF: null, // 4 Foto untuk di convert ke GIF

      addCapture: (photo) => set((s) => ({ captures: [...s.captures, photo] })),
      addVideoCapture: (video) => set((s) => ({ capturesVideo: [...s.capturesVideo, video] })),

      setTemplate: (template) => set({ template }),
      retakeSlot: (slotIndex) => set((s) => ({ captures: s.captures.filter(c => c.slotIndex !== slotIndex) })),
      retakeVideoSlot: (slotIndex) => set((s) => ({ capturesVideo: s.capturesVideo.filter(v => v.slotIndex !== slotIndex) })),
      setTotalSlots: (count) => set({ totalSlots: count }),

      setTemplateWithPhoto: (data) => set({ templateWithPhoto: data }),
      setTemplateWithPhotoProduction: (data) => set({ templateWithPhotoProduction: data }),
      setTemplateWithVideo: (data) => set({ templateWithVideo: data }),  // ← fix bug: was templateWithPhoto
      setCapturesToGIF: (data) => set({ capturesToGIF: data }),           // ← fix bug: was templateWithPhoto

      setTemplateAndGif: (data) => set({
        templateWithPhoto: data.templateWithPhoto,
        templateWithPhotoProduction: data.templateWithPhotoProduction,
        templateWithVideo: data.templateWithVideo,
        capturesToGIF: data.capturesToGIF
      }),

      clearPhotos: async () => {
        set({ captures: [], capturesVideo: [], template: null, totalSlots: 1, templateWithPhoto: null, templateWithVideo: null, capturesToGIF: null })
        await idbDel('retroppies-captures')
      },
      isComplete: () => {
        const { captures, totalSlots } = get()
        return captures.length >= totalSlots
      },
    }),
    {
      name: "retroppies-captures",
      storage: indexedDBStorage, // ← langsung, tanpa createJSONStorage
      partialize: (s) => ({
        captures: s.captures, // 4 Foto Raw
        capturesVideo: s.capturesVideo, // 4 Video Raw
        template: s.template, // Template Raw
        totalSlots: s.totalSlots, // Slots
        templateWithPhotoProduction: s.templateWithPhotoProduction, // Template yang di inject dengan foto (UNTUK DI PRINT)
        // Template yang di inject dengan foto + video tidak disimpan
        // GIF tidak disimpan
      }),
    }
  )
)