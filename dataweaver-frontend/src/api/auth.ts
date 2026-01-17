import apiClient from './client'
import type { LoginRequest, RegisterRequest, LoginResponse, RegisterResponse } from '@/types/auth'

export const authApi = {
  // Login with username and password
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/v1/auth/login', data),

  // Register a new user
  register: (data: RegisterRequest) =>
    apiClient.post<RegisterResponse>('/v1/auth/register', data),
}
