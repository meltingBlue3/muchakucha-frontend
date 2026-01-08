<template>
  <div class="auth-page">
    <n-card class="auth-card" :bordered="false">
      <h1 class="auth-title">注册</h1>
      
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
          />
        </n-form-item>

        <n-form-item path="nickname" label="昵称">
          <n-input
            v-model:value="formData.nickname"
            placeholder="请输入昵称"
          />
        </n-form-item>

        <n-form-item path="password" label="密码">
          <n-input
            v-model:value="formData.password"
            type="password"
            show-password-on="click"
            placeholder="请输入密码（至少6位）"
            @blur="handlePasswordBlur"
          />
        </n-form-item>

        <n-form-item path="confirmPassword" label="确认密码">
          <n-input
            v-model:value="formData.confirmPassword"
            type="password"
            show-password-on="click"
            placeholder="请再次输入密码"
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
          {{ loading ? '注册中...' : '注册' }}
        </n-button>
      </n-form>

      <div class="auth-footer">
        <n-text depth="3">已有账号？</n-text>
        <router-link to="/login" class="auth-link">立即登录</router-link>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
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
  type FormRules,
  type FormItemRule
} from 'naive-ui'

const router = useRouter()
const authStore = useAuthStore()
const groupStore = useGroupStore()
const message = useMessage()

const formRef = ref<FormInst | null>(null)
const formData = ref({
  email: '',
  nickname: '',
  password: '',
  confirmPassword: ''
})

const validatePasswordSame = (_rule: FormItemRule, value: string): boolean => {
  return value === formData.value.password
}

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
  nickname: [
    {
      required: true,
      message: '请输入昵称',
      trigger: ['blur', 'input']
    }
  ],
  password: [
    {
      required: true,
      message: '请输入密码',
      trigger: ['blur', 'input']
    },
    {
      min: 6,
      message: '密码至少需要6位',
      trigger: ['blur', 'input']
    }
  ],
  confirmPassword: [
    {
      required: true,
      message: '请再次输入密码',
      trigger: ['blur', 'input']
    },
    {
      validator: validatePasswordSame,
      message: '两次输入的密码不一致',
      trigger: ['blur', 'input']
    }
  ]
}

const loading = ref(false)

const handlePasswordBlur = () => {
  // 当密码字段失焦时，如果确认密码已有值，重新验证确认密码
  if (formData.value.confirmPassword) {
    formRef.value?.validate(undefined, (rule) => rule?.key === 'confirmPassword')
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true

  try {
    // 只发送必要的字段，不包括 confirmPassword
    const { confirmPassword, ...registerData } = formData.value
    await authStore.register(registerData)
    
    message.success('注册成功')
    
    // 注册成功后会自动登录，初始化群组
    await groupStore.initialize()
    
    // 跳转到群组列表
    router.push('/groups')
  } catch (err: any) {
    message.error(err.message || '注册失败，请检查输入信息')
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
