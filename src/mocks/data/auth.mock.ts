import { ResultLogin } from '@/services/authService'
import { mockDelay } from '../mockFlag'
import { BaseResponse } from '@/services/apiClient'

interface LoginRequest {
  username: string
  password: string
}

// Accepted mock credentials
const MOCK_ACCOUNTS: Record<string, string> = {
  admin: 'admin123',
  operator: 'pass1234',
}

export async function mockLogin(credentials: LoginRequest): Promise<BaseResponse<ResultLogin>> {
  await mockDelay(800)

  const validPassword = MOCK_ACCOUNTS[credentials.username]
  if (!validPassword || validPassword !== credentials.password) {
    throw new Error('MOCK: Invalid credentials')
  }

  return {
    message: 'Login successful (mock)',
    statusCode: 200,
    success: true,
    responseDatetime: new Date().toISOString(),
    result: {
      token: 'mock-jwt-token-dev-only',
      userId: 1,
      roleId: -99,
      tenantId: 1,
      isSuperadmin: false,
      username: credentials.username,
      permissions: ['read', 'write', 'delete'],
    }
  }
}
