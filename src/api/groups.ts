import client from './client'
import type {
  Group,
  GroupCreate,
  GroupUpdate,
  GroupMemberAdd,
  GroupMemberUpdate,
  GroupMemberDetail
} from '@/types'

/**
 * 获取当前用户的所有群组
 */
export const getMyGroups = async (): Promise<Group[]> => {
  const response = await client.get<Group[]>('/api/groups')
  return response.data
}

/**
 * 创建群组
 */
export const createGroup = async (data: GroupCreate): Promise<Group> => {
  const response = await client.post<Group>('/api/groups', data)
  return response.data
}

/**
 * 获取群组详情
 */
export const getGroup = async (groupId: number): Promise<Group> => {
  const response = await client.get<Group>(`/api/groups/${groupId}`)
  return response.data
}

/**
 * 更新群组信息
 */
export const updateGroup = async (
  groupId: number,
  data: GroupUpdate
): Promise<Group> => {
  const response = await client.put<Group>(`/api/groups/${groupId}`, data)
  return response.data
}

/**
 * 删除群组
 */
export const deleteGroup = async (groupId: number): Promise<void> => {
  await client.delete(`/api/groups/${groupId}`)
}

/**
 * 添加群组成员
 */
export const addMember = async (
  groupId: number,
  data: GroupMemberAdd
): Promise<Record<string, unknown>> => {
  const response = await client.post<Record<string, unknown>>(
    `/api/groups/${groupId}/members`,
    data
  )
  return response.data
}

/**
 * 获取群组成员列表
 */
export const getGroupMembers = async (
  groupId: number
): Promise<GroupMemberDetail[]> => {
  const response = await client.get<GroupMemberDetail[]>(
    `/api/groups/${groupId}/members`
  )
  return response.data
}

/**
 * 更新成员角色
 */
export const updateMemberRole = async (
  groupId: number,
  userId: number,
  data: GroupMemberUpdate
): Promise<Record<string, unknown>> => {
  const response = await client.put<Record<string, unknown>>(
    `/api/groups/${groupId}/members/${userId}`,
    data
  )
  return response.data
}

/**
 * 移除群组成员
 */
export const removeMember = async (
  groupId: number,
  userId: number
): Promise<void> => {
  await client.delete(`/api/groups/${groupId}/members/${userId}`)
}

