import { mockDelay } from '../mockFlag'

interface LoginRequest {
  username: string
  password: string
}

interface LoginResponse {
  token: string
  admin: { id: string; name: string }
  settings: { sessionDurationSec: number; currency: string }
}

// Accepted mock credentials
const MOCK_ACCOUNTS: Record<string, string> = {
  admin: 'admin123',
  operator: 'pass1234',
}

export async function mockLogin(credentials: LoginRequest): Promise<LoginResponse> {
  await mockDelay(800)

  const validPassword = MOCK_ACCOUNTS[credentials.username]
  if (!validPassword || validPassword !== credentials.password) {
    throw new Error('MOCK: Invalid credentials')
  }

  return {
    token: 'mock-jwt-token-dev-only',
    admin: { id: 'mock-admin-1', name: credentials.username },
    settings: {
      sessionDurationSec: 180,
      currency: 'IDR',
    },
  }
}
