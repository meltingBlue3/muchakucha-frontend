<template>
  <div class="auth-page">
    <n-card class="auth-card" :bordered="false">
      <h1 class="auth-title">登录</h1>
      
      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        @submit.prevent="handleSubmit"
        size="large"
      >
        <n-form-item path="email" label="邮箱">
          <n-input
            v-model:value="formData.email"
            placeholder="请输入邮箱"
            @keydown.enter="handleSubmit"
          />
        </n-form-item>

        <n-form-item path="password" label="密码">
          <n-input
            v-model:value="formData.password"
            type="password"
            show-password-on="click"
            placeholder="请输入密码"
            @keydown.enter="handleSubmit"
          />
        </n-form-item>

        <n-button
          type="primary"
          block
          :loading="loading"
          :disabled="loading"
          @click="handleSubmit"
          style="margin-top: 8px;"
        >
          {{ loading ? '登录中...' : '登录' }}
        </n-button>
      </n-form>

      <div class="auth-footer">
        <n-text depth="3">还没有账号？</n-text>
        <router-link to="/register" class="auth-link">立即注册</router-link>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupStore } from '@/stores/group'
import { 
  NCard, 
  NForm, 
  NFormItem, 
  NInput, 
  NButton, 
  NText,
  useMessage,
  type FormInst,
  type FormRules
} from 'naive-ui'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const groupStore = useGroupStore()
const message = useMessage()

const formRef = ref<FormInst | null>(null)
const formData = ref({
  email: '',
  password: ''
})

const rules: FormRules = {
  email: [
    {
      required: true,
      message: '请输入邮箱',
      trigger: ['blur', 'input']
    },
    {
      type: 'email',
      message: '请输入有效的邮箱地址',
      trigger: ['blur', 'input']
    }
  ],
  password: [
    {
      required: true,
      message: '请输入密码',
      trigger: ['blur', 'input']
    }
  ]
}

const loading = ref(false)

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true

  try {
    await authStore.login(formData.value)
    
    // 登录成功后初始化群组
    await groupStore.initialize()
    
    message.success('登录成功')
    
    // 跳转到目标页面，优先级：query.redirect > 保存的路由 > 群组列表
    const redirect = route.query.redirect as string
    const savedRoute = localStorage.getItem('last_route')
    const targetRoute = redirect || (savedRoute && savedRoute !== '/login' && savedRoute !== '/register' ? savedRoute : '/groups')
    router.push(targetRoute)
  } catch (err: any) {
    message.error(err.message || '登录失败，请检查邮箱和密码')
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
  background-color: #f5f7fa;
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.auth-title {
  margin: 0 0 32px;
  font-size: 28px;
  font-weight: 600;
  text-align: center;
  color: #333;
}

.auth-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
}

.auth-link {
  color: #2080f0;
  text-decoration: none;
  margin-left: 4px;
  font-weight: 500;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>
