import { create } from 'zustand'

interface AdminProfile {
  id: string
  name: string
}

interface SessionSettings {
  sessionDurationSec: number
  currency: string
}

interface AuthState {
  token: string | null
  admin: AdminProfile | null
  settings: SessionSettings
  isAuthenticated: boolean
  setAuth: (token: string, admin: AdminProfile, settings: SessionSettings) => void
  clearAuth: () => void
}

const DEFAULT_SETTINGS: SessionSettings = {
  sessionDurationSec: 180,
  currency: 'IDR',
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  admin: null,
  settings: DEFAULT_SETTINGS,
  isAuthenticated: false,
  setAuth: (token, admin, settings) =>
    set({ token, admin, settings, isAuthenticated: true }),
  clearAuth: () =>
    set({ token: null, admin: null, settings: DEFAULT_SETTINGS, isAuthenticated: false }),
}))
