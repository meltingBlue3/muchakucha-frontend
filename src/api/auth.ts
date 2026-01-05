import client from './client'
import type { User, UserCreate, LoginRequest, Token } from '@/types'

/**
 * 用户注册
 */
export const register = async (data: UserCreate): Promise<User> => {
  const response = await client.post<User>('/api/auth/register', data)
  return response.data
}

/**
 * 用户登录
 */
export const login = async (data: LoginRequest): Promise<Token> => {
  const response = await client.post<Token>('/api/auth/login', data)
  return response.data
}

/**
 * 获取当前用户信息
 */
export const getMe = async (): Promise<User> => {
  const response = await client.get<User>('/api/auth/me')
  return response.data
}

