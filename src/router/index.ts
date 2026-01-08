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
    redirect: () => {
      // 尝试恢复之前保存的路由
      const savedRoute = localStorage.getItem('last_route')
      if (savedRoute && savedRoute !== '/login' && savedRoute !== '/register') {
        return savedRoute
      }
      return '/groups'
    }
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
    // 已登录用户访问登录/注册页，尝试恢复之前的路由
    if (to.name === 'Login' || to.name === 'Register') {
      const savedRoute = localStorage.getItem('last_route')
      if (savedRoute && savedRoute !== '/login' && savedRoute !== '/register') {
        next(savedRoute)
      } else {
        next({ name: 'Groups' })
      }
      return
    }
  }

  // 检查是否需要选择群组
  if (to.meta.requiresGroup && !groupStore.currentGroupId) {
    // 如果群组列表为空，先尝试获取群组
    if (groupStore.groups.length === 0) {
      try {
        await groupStore.initialize()
      } catch (error) {
        // 获取群组失败，跳转到群组列表页
        next({ name: 'Groups' })
        return
      }
    }
    
    // 如果仍然没有当前群组，跳转到群组列表页
    if (!groupStore.currentGroupId) {
      next({ name: 'Groups' })
      return
    }
  }

  next()
})

// 全局后置守卫：保存当前路由
router.afterEach((to) => {
  // 保存当前路由（排除登录和注册页）
  if (to.name !== 'Login' && to.name !== 'Register') {
    localStorage.setItem('last_route', to.fullPath)
  }
})

export default router

