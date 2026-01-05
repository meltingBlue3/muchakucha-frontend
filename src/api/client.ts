import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@/types'

// 创建 axios 实例
const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：自动附加 JWT token
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 读取 token
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：处理错误
client.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    // 401 未授权，清除 token 并跳转到登录页
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      // 如果不在登录页，则跳转到登录页
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    // 格式化错误信息
    const apiError: ApiError = {
      message: error.response?.data?.detail || error.message || '请求失败',
      detail: error.response?.data
    }

    return Promise.reject(apiError)
  }
)

export default client

