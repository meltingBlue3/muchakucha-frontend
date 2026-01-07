import client from './client'
import type { Task, TaskCreate, TaskUpdate } from '@/types'

/**
 * 创建任务
 */
export const createTask = async (
  groupId: number,
  data: TaskCreate
): Promise<Task> => {
  const response = await client.post<Task>(
    `/api/groups/${groupId}/tasks`,
    data
  )
  return response.data
}

/**
 * 获取任务列表（支持状态/优先级/标签过滤）
 */
export const getTasks = async (
  groupId: number,
  status?: string,
  priority?: string,
  labelIds?: number[]
): Promise<Task[]> => {
  const params: Record<string, string> = {}
  if (status) params.status = status
  if (priority) params.priority = priority
  if (labelIds && labelIds.length > 0) params.label_ids = labelIds.join(',')

  const response = await client.get<Task[]>(`/api/groups/${groupId}/tasks`, {
    params
  })
  return response.data
}

/**
 * 获取任务详情
 */
export const getTask = async (
  groupId: number,
  taskId: number
): Promise<Task> => {
  const response = await client.get<Task>(
    `/api/groups/${groupId}/tasks/${taskId}`
  )
  return response.data
}

/**
 * 更新任务
 */
export const updateTask = async (
  groupId: number,
  taskId: number,
  data: TaskUpdate
): Promise<Task> => {
  const response = await client.put<Task>(
    `/api/groups/${groupId}/tasks/${taskId}`,
    data
  )
  return response.data
}

/**
 * 删除任务
 */
export const deleteTask = async (
  groupId: number,
  taskId: number
): Promise<void> => {
  await client.delete(`/api/groups/${groupId}/tasks/${taskId}`)
}

