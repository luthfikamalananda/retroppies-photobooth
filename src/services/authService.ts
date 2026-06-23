
import { apiClient, BaseResponse } from './apiClient'


interface LoginRequest {
  username: string
  password: string
}

export interface ResultLogin {
  token: string
  userId: number
  username: string
  roleId: number
  permissions: string[]
  tenantId: number
  isSuperadmin: boolean
}

export async function login(credentials: LoginRequest): Promise<BaseResponse<ResultLogin>> {
  const res = await apiClient.post<BaseResponse<ResultLogin>>('/users/login', credentials, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa(`photobox:PhotoBox123@`)
    },
    skipInterceptor: true
  })
  return res.data
}
