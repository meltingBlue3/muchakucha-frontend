import client from './client'
import type { Label, LabelCreate, LabelUpdate, LabelWithStats } from '@/types'

/**
 * 创建标签
 */
export const createLabel = async (
  groupId: number,
  data: LabelCreate
): Promise<Label> => {
  const response = await client.post<Label>(
    `/api/groups/${groupId}/labels`,
    data
  )
  return response.data
}

/**
 * 获取群组所有标签
 */
export const getLabels = async (groupId: number): Promise<Label[]> => {
  const response = await client.get<Label[]>(`/api/groups/${groupId}/labels`)
  return response.data
}

/**
 * 获取带统计信息的标签列表
 */
export const getLabelsStats = async (
  groupId: number
): Promise<LabelWithStats[]> => {
  const response = await client.get<LabelWithStats[]>(
    `/api/groups/${groupId}/labels/stats`
  )
  return response.data
}

/**
 * 获取标签详情
 */
export const getLabel = async (
  groupId: number,
  labelId: number
): Promise<Label> => {
  const response = await client.get<Label>(
    `/api/groups/${groupId}/labels/${labelId}`
  )
  return response.data
}

/**
 * 更新标签
 */
export const updateLabel = async (
  groupId: number,
  labelId: number,
  data: LabelUpdate
): Promise<Label> => {
  const response = await client.put<Label>(
    `/api/groups/${groupId}/labels/${labelId}`,
    data
  )
  return response.data
}

/**
 * 删除标签
 */
export const deleteLabel = async (
  groupId: number,
  labelId: number
): Promise<void> => {
  await client.delete(`/api/groups/${groupId}/labels/${labelId}`)
}

