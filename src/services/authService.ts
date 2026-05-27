import { apiClient } from './apiClient'
import { USE_MOCK } from '@/mocks/mockFlag'
import { mockLogin } from '@/mocks/data/auth.mock'

interface LoginRequest {
  username: string
  password: string
}

interface LoginResponse {
  token: string
  admin: { id: string; name: string }
  settings: { sessionDurationSec: number; currency: string }
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  if (USE_MOCK) return mockLogin(credentials)
  const res = await apiClient.post<LoginResponse>('/auth/login', credentials)
  return res.data
}
