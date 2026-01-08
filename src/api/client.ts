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
    let message = error.message || '请求失败'
    const responseData = error.response?.data as any

    // 处理验证错误（422）
    if (error.response?.status === 422 && responseData?.detail) {
      const details = Array.isArray(responseData.detail) ? responseData.detail : [responseData.detail]
      const errorMessages = details.map((err: any) => {
        // 提取字段名（通常是 loc 数组的最后一个元素）
        const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : '字段'
        // 提取错误消息
        let msg = err.msg || ''
        
        // 将英文错误消息转换为中文
        if (msg.includes('not a valid email address')) {
          if (msg.includes('The part after the @-sign is not valid')) {
            msg = '邮箱格式不正确：@ 符号后的部分无效，应包含域名'
          } else {
            msg = '邮箱格式不正确'
          }
        } else if (msg.includes('required')) {
          msg = `${field} 是必填项`
        } else if (msg.includes('value_error')) {
          msg = msg.replace(/value is not a valid email address: /, '邮箱格式不正确：')
        }
        
        // 如果字段是 body，不显示字段名
        return field === 'body' ? msg : `${field}: ${msg}`
      })
      message = errorMessages.join('; ')
    } else if (responseData?.detail) {
      // 其他类型的错误
      message = typeof responseData.detail === 'string' 
        ? responseData.detail 
        : responseData.detail?.message || message
    }

    const apiError: ApiError = {
      message,
      detail: responseData
    }

    return Promise.reject(apiError)
  }
)

export default client

