import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as groupApi from '@/api/groups'
import type { Group, GroupCreate } from '@/types'

export const useGroupStore = defineStore('group', () => {
  // State
  const groups = ref<Group[]>([])
  const currentGroup = ref<Group | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const currentGroupId = computed(() => currentGroup.value?.id || null)

  // Actions
  /**
   * 获取用户的所有群组
   */
  const fetchGroups = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await groupApi.getMyGroups()
      groups.value = data
      
      // 如果没有选择当前群组，自动选择第一个
      if (!currentGroup.value && data.length > 0) {
        currentGroup.value = data[0]
        // 保存到 localStorage
        localStorage.setItem('current_group_id', String(data[0].id))
      }
      
      return data
    } catch (err: any) {
      error.value = err.message || '获取群组列表失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建群组
   */
  const createGroup = async (data: GroupCreate) => {
    loading.value = true
    error.value = null
    try {
      const newGroup = await groupApi.createGroup(data)
      groups.value.push(newGroup)
      // 自动切换到新创建的群组
      setCurrentGroup(newGroup)
      return newGroup
    } catch (err: any) {
      error.value = err.message || '创建群组失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 设置当前活动群组
   */
  const setCurrentGroup = (group: Group | null) => {
    currentGroup.value = group
    if (group) {
      localStorage.setItem('current_group_id', String(group.id))
    } else {
      localStorage.removeItem('current_group_id')
    }
  }

  /**
   * 从 localStorage 恢复当前群组
   */
  const restoreCurrentGroup = () => {
    const savedGroupId = localStorage.getItem('current_group_id')
    if (savedGroupId && groups.value.length > 0) {
      const group = groups.value.find(g => g.id === Number(savedGroupId))
      if (group) {
        currentGroup.value = group
      }
    }
  }

  /**
   * 初始化：获取群组列表并恢复当前群组
   */
  const initialize = async () => {
    await fetchGroups()
    restoreCurrentGroup()
  }

  /**
   * 更新群组信息
   */
  const updateGroup = async (groupId: number, data: any) => {
    try {
      const updatedGroup = await groupApi.updateGroup(groupId, data)
      const index = groups.value.findIndex(g => g.id === groupId)
      if (index !== -1) {
        groups.value[index] = updatedGroup
      }
      if (currentGroup.value?.id === groupId) {
        currentGroup.value = updatedGroup
      }
      return updatedGroup
    } catch (err: any) {
      error.value = err.message || '更新群组失败'
      throw err
    }
  }

  /**
   * 删除群组
   */
  const deleteGroup = async (groupId: number) => {
    try {
      await groupApi.deleteGroup(groupId)
      groups.value = groups.value.filter(g => g.id !== groupId)
      // 如果删除的是当前群组，切换到第一个群组
      if (currentGroup.value?.id === groupId) {
        currentGroup.value = groups.value[0] || null
        if (currentGroup.value) {
          localStorage.setItem('current_group_id', String(currentGroup.value.id))
        } else {
          localStorage.removeItem('current_group_id')
        }
      }
    } catch (err: any) {
      error.value = err.message || '删除群组失败'
      throw err
    }
  }

  /**
   * 清空状态（用于退出登录）
   */
  const clear = () => {
    groups.value = []
    currentGroup.value = null
    localStorage.removeItem('current_group_id')
  }

  return {
    // State
    groups,
    currentGroup,
    loading,
    error,
    // Getters
    currentGroupId,
    // Actions
    fetchGroups,
    createGroup,
    setCurrentGroup,
    restoreCurrentGroup,
    initialize,
    updateGroup,
    deleteGroup,
    clear
  }
})

