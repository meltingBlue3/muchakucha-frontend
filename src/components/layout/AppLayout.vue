<template>
  <div class="app-layout">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-left">
        <h1 class="app-title">家庭日历</h1>
      </div>
      
      <div class="header-center">
        <GroupSelector v-if="groupStore.currentGroupId" />
      </div>

      <div class="header-right">
        <span class="user-info" v-if="authStore.user">
          {{ authStore.user.nickname }}
        </span>
        <button @click="handleLogout" class="btn-logout">退出</button>
      </div>
    </header>

    <!-- 主内容区 -->
    <div class="app-body">
      <!-- 侧边导航 -->
      <aside class="app-sidebar">
        <nav class="nav-menu">
          <router-link to="/groups" class="nav-item">
            <span>群组管理</span>
          </router-link>
          
          <template v-if="groupStore.currentGroupId">
            <router-link to="/calendar" class="nav-item">
              <span>日历事件</span>
            </router-link>
            
            <router-link to="/tasks" class="nav-item">
              <span>任务管理</span>
            </router-link>
            
            <router-link to="/notes" class="nav-item">
              <span>笔记</span>
            </router-link>
          </template>
        </nav>
      </aside>

      <!-- 主内容 -->
      <main class="app-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupStore } from '@/stores/group'
import GroupSelector from './GroupSelector.vue'

const router = useRouter()
const authStore = useAuthStore()
const groupStore = useGroupStore()

const handleLogout = () => {
  authStore.logout()
  groupStore.clear()
  router.push('/login')
}
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #4CAF50;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
}

.user-info {
  font-size: 14px;
}

.btn-logout {
  padding: 6px 16px;
  font-size: 14px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-logout:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.app-body {
  display: flex;
  flex: 1;
}

.app-sidebar {
  width: 200px;
  background-color: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  padding: 16px 0;
}

.nav-menu {
  display: flex;
  flex-direction: column;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  color: #333;
  text-decoration: none;
  transition: background-color 0.2s;
}

.nav-item:hover {
  background-color: #e8f5e9;
}

.nav-item.router-link-active {
  background-color: #c8e6c9;
  color: #2e7d32;
  font-weight: 500;
  border-right: 3px solid #4CAF50;
}

.app-main {
  flex: 1;
  padding: 24px;
  background-color: #fff;
  overflow-y: auto;
}
</style>

