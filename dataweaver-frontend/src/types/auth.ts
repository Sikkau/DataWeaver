// Auth request and response types based on backend API

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface UserInfo {
  id: number
  username: string
  email: string
  is_active: boolean
}

export interface AuthData {
  token: string
  expires_at: string
  user: UserInfo
}

// Backend response format: { code: 0, message: "success", data: {...} }
export interface LoginResponse {
  code: number
  message: string
  data?: AuthData
}

export interface RegisterResponse {
  code: number
  message: string
  data?: AuthData
}
