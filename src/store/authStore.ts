import { PaperSize } from '@/components/Auth/AdminLoginPage'
import { ResultLogin } from '@/services/authService'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'


interface AuthState {
  user: ResultLogin & { paperType: PaperSize } | null
  setUser: (user: ResultLogin & { paperType: PaperSize } | null) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (response) => set({ user: response }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
