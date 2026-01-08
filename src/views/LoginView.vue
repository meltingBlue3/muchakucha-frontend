<template>
  <div class="auth-page">
    <div class="auth-container">
      <h1 class="auth-title">登录</h1>
      
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label for="email">邮箱</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            required
            placeholder="请输入邮箱"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            required
            placeholder="请输入密码"
            class="form-input"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="btn-submit"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="auth-footer">
        <span>还没有账号？</span>
        <router-link to="/register" class="auth-link">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupStore } from '@/stores/group'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const groupStore = useGroupStore()

const formData = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    await authStore.login(formData.value)
    
    // 登录成功后初始化群组
    await groupStore.initialize()
    
    // 跳转到目标页面，优先级：query.redirect > 保存的路由 > 群组列表
    const redirect = route.query.redirect as string
    const savedRoute = localStorage.getItem('last_route')
    const targetRoute = redirect || (savedRoute && savedRoute !== '/login' && savedRoute !== '/register' ? savedRoute : '/groups')
    router.push(targetRoute)
  } catch (err: any) {
    error.value = err.message || '登录失败，请检查邮箱和密码'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-container {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.auth-title {
  margin: 0 0 32px;
  font-size: 28px;
  font-weight: 600;
  text-align: center;
  color: #333;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

.form-input {
  padding: 12px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.error-message {
  padding: 12px;
  font-size: 14px;
  color: #d32f2f;
  background-color: #ffebee;
  border-radius: 4px;
  text-align: center;
}

.btn-submit {
  padding: 12px;
  font-size: 16px;
  font-weight: 500;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-submit:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.auth-link {
  color: #667eea;
  text-decoration: none;
  margin-left: 4px;
  font-weight: 500;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>

