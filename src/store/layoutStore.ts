import { create } from 'zustand'

export type FilterId = 'original' | 'vivid' | 'sepia' | 'grayscale' | 'warm' | 'cold' | 'polaroid' | 'vignette'

export interface TemplateInfo {
  id: string
  name: string
  slotCount: number
  thumbnailUrl: string
}

interface LayoutState {
  selectedTemplate: TemplateInfo | null
  slotMap: Record<number, string> // slotIndex → photo dataUrl
  selectedFilter: FilterId
  finalCanvasBlob: Blob | null

  setTemplate: (template: TemplateInfo) => void
  mapSlot: (slotIndex: number, dataUrl: string) => void
  setFilter: (filter: FilterId) => void
  setFinalCanvasBlob: (blob: Blob) => void
  clearLayout: () => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
  selectedTemplate: null,
  slotMap: {},
  selectedFilter: 'original',
  finalCanvasBlob: null,

  setTemplate: (template) => set({ selectedTemplate: template, slotMap: {} }),
  mapSlot: (slotIndex, dataUrl) =>
    set((s) => ({ slotMap: { ...s.slotMap, [slotIndex]: dataUrl } })),
  setFilter: (filter) => set({ selectedFilter: filter }),
  setFinalCanvasBlob: (blob) => set({ finalCanvasBlob: blob }),
  clearLayout: () =>
    set({ selectedTemplate: null, slotMap: {}, selectedFilter: 'original', finalCanvasBlob: null }),
}))
