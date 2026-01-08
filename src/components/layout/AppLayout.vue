<template>
  <n-layout has-sider class="app-layout">
    <!-- 侧边导航 -->
    <n-layout-sider
      bordered
      :collapsed-width="0"
      :width="200"
      :native-scrollbar="false"
      content-style="padding: 16px 0;"
    >
      <n-menu
        :value="activeKey"
        :options="menuOptions"
        @update:value="handleMenuSelect"
      />
    </n-layout-sider>

    <!-- 主内容区 -->
    <n-layout>
      <!-- 顶部导航栏 -->
      <n-layout-header bordered class="app-header">
        <div class="header-left">
          <h1 class="app-title">家庭日历</h1>
        </div>
        
        <div class="header-center">
          <GroupSelector v-if="groupStore.currentGroupId" />
        </div>

        <div class="header-right">
          <n-text v-if="authStore.user" class="user-info">
            {{ authStore.user.nickname }}
          </n-text>
          <n-button secondary size="small" @click="handleLogout">
            退出
          </n-button>
        </div>
      </n-layout-header>

      <!-- 主内容 -->
      <n-layout-content content-style="padding: 24px;">
        <slot />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupStore } from '@/stores/group'
import { 
  NLayout, 
  NLayoutHeader, 
  NLayoutSider, 
  NLayoutContent, 
  NMenu, 
  NButton,
  NText
} from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import GroupSelector from './GroupSelector.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const groupStore = useGroupStore()

// 当前激活的菜单项
const activeKey = computed(() => {
  const path = route.path
  if (path.startsWith('/groups')) return 'groups'
  if (path.startsWith('/calendar')) return 'calendar'
  if (path.startsWith('/tasks')) return 'tasks'
  if (path.startsWith('/notes')) return 'notes'
  return null
})

// 菜单配置
const menuOptions = computed<MenuOption[]>(() => {
  const options: MenuOption[] = [
    {
      label: '群组管理',
      key: 'groups'
    }
  ]
  
  if (groupStore.currentGroupId) {
    options.push(
      {
        label: '日历事件',
        key: 'calendar'
      },
      {
        label: '任务管理',
        key: 'tasks'
      },
      {
        label: '笔记',
        key: 'notes'
      }
    )
  }
  
  return options
})

// 菜单选择处理
const handleMenuSelect = (key: string) => {
  router.push(`/${key}`)
}

const handleLogout = () => {
  authStore.logout()
  groupStore.clear()
  router.push('/login')
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  height: 64px;
}

.header-left,
.header-center,
.header-right {
  flex: 1;
  display: flex;
  align-items: center;
}

.header-center {
  justify-content: center;
}

.header-right {
  justify-content: flex-end;
  gap: 16px;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #2080f0;
}

.user-info {
  font-size: 14px;
}
</style>
