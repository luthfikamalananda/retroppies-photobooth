import { create } from 'zustand'

interface KeyboardStore {
  /** Whether the floating keyboard is visible */
  isOpen: boolean
  /** Callback invoked with each key character. Special keys: 'BACKSPACE', 'OK' */
  onKeyPress: ((char: string) => void) | null
  /**
   * Open the keyboard and wire it to an input via a callback.
   * @param onKeyPress - receives individual characters or special keys
   */
  open: (onKeyPress: (char: string) => void) => void
  close: () => void
  position: {
    x: number
    y: number
  }
  setPosition: (data: { x: number, y: number }) => void
}

export const useKeyboardStore = create<KeyboardStore>((set) => ({
  isOpen: false,
  onKeyPress: null,
  open: (onKeyPress) => {
    set({ isOpen: true, onKeyPress })
  },
  close: () => set({ isOpen: false, onKeyPress: null }),
  position: {
    x: 0,
    y: 0
  },
  setPosition: (data: { x: number, y: number }) => set({ position: data }),
}))
