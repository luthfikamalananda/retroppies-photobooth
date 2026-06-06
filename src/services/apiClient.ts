/// <reference types="vite/client" />
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export interface BaseResponse<T> {
  statusCode: number;
  success: boolean;
  responseDatetime: string;
  result: T;
  message: string;
}


export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().user?.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 — clear auth and redirect to login
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearUser()
      // Navigate to login page via dynamic import to avoid circular dependency
      import('@/store/sessionStore').then(m => {
        m.useSessionStore.getState().goTo(0)
      }).catch(() => {
        // Silent fail if import fails
      })
    }
    return Promise.reject(error)
  }
)
