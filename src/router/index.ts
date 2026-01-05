import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupStore } from '@/stores/group'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/groups',
    name: 'Groups',
    component: () => import('@/views/GroupsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: () => import('@/views/CalendarView.vue'),
    meta: { requiresAuth: true, requiresGroup: true }
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: () => import('@/views/TasksView.vue'),
    meta: { requiresAuth: true, requiresGroup: true }
  },
  {
    path: '/notes',
    name: 'Notes',
    component: () => import('@/views/NotesView.vue'),
    meta: { requiresAuth: true, requiresGroup: true }
  },
  {
    path: '/',
    redirect: '/groups'
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/groups'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const groupStore = useGroupStore()

  // 初始化 auth store（仅第一次）
  if (!authStore.user && localStorage.getItem('access_token')) {
    try {
      await authStore.initialize()
    } catch (error) {
      // 初始化失败，清除 token
      authStore.logout()
    }
  }

  // 检查路由是否需要认证
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isAuthenticated) {
    // 未登录，跳转到登录页
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (!requiresAuth && authStore.isAuthenticated) {
    // 已登录用户访问登录/注册页，跳转到首页
    if (to.name === 'Login' || to.name === 'Register') {
      next({ name: 'Groups' })
      return
    }
  }

  // 检查是否需要选择群组
  if (to.meta.requiresGroup && !groupStore.currentGroupId) {
    // 需要群组但未选择，跳转到群组列表页
    next({ name: 'Groups' })
    return
  }

  next()
})

export default router

