import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/api/auth'
import type { User, UserCreate, LoginRequest } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(null)
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // Actions
  /**
   * 初始化：从 localStorage 恢复 token 并验证
   */
  const initialize = async () => {
    const savedToken = localStorage.getItem('access_token')
    if (savedToken) {
      token.value = savedToken
      try {
        await fetchMe()
      } catch (err) {
        // Token 无效，清除
        logout()
      }
    }
  }

  /**
   * 用户注册
   */
  const register = async (data: UserCreate) => {
    loading.value = true
    error.value = null
    try {
      const newUser = await authApi.register(data)
      // 注册成功后自动登录
      await login({ email: data.email, password: data.password })
      return newUser
    } catch (err: any) {
      error.value = err.message || '注册失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户登录
   */
  const login = async (data: LoginRequest) => {
    loading.value = true
    error.value = null
    try {
      const tokenData = await authApi.login(data)
      token.value = tokenData.access_token
      // 保存到 localStorage
      localStorage.setItem('access_token', tokenData.access_token)
      // 获取用户信息
      await fetchMe()
    } catch (err: any) {
      error.value = err.message || '登录失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取当前用户信息
   */
  const fetchMe = async () => {
    try {
      const userData = await authApi.getMe()
      user.value = userData
    } catch (err: any) {
      error.value = err.message || '获取用户信息失败'
      throw err
    }
  }

  /**
   * 退出登录
   */
  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('access_token')
  }

  return {
    // State
    token,
    user,
    loading,
    error,
    // Getters
    isAuthenticated,
    // Actions
    initialize,
    register,
    login,
    fetchMe,
    logout
  }
})

