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
}

export const useKeyboardStore = create<KeyboardStore>((set) => ({
  isOpen: false,
  onKeyPress: null,
  open: (onKeyPress) => {
    set({ isOpen: true, onKeyPress })
  },
  close: () => set({ isOpen: false, onKeyPress: null }),
}))
