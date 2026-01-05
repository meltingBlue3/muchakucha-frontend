import client from './client'
import type { Event, EventCreate, EventUpdate } from '@/types'

/**
 * 创建事件
 */
export const createEvent = async (
  groupId: number,
  data: EventCreate
): Promise<Event> => {
  const response = await client.post<Event>(
    `/api/groups/${groupId}/events`,
    data
  )
  return response.data
}

/**
 * 获取事件列表（支持日期范围过滤）
 */
export const getEvents = async (
  groupId: number,
  startDate?: string,
  endDate?: string
): Promise<Event[]> => {
  const params: Record<string, string> = {}
  if (startDate) params.start_date = startDate
  if (endDate) params.end_date = endDate

  const response = await client.get<Event[]>(`/api/groups/${groupId}/events`, {
    params
  })
  return response.data
}

/**
 * 获取事件详情
 */
export const getEvent = async (
  groupId: number,
  eventId: number
): Promise<Event> => {
  const response = await client.get<Event>(
    `/api/groups/${groupId}/events/${eventId}`
  )
  return response.data
}

/**
 * 更新事件
 */
export const updateEvent = async (
  groupId: number,
  eventId: number,
  data: EventUpdate
): Promise<Event> => {
  const response = await client.put<Event>(
    `/api/groups/${groupId}/events/${eventId}`,
    data
  )
  return response.data
}

/**
 * 删除事件
 */
export const deleteEvent = async (
  groupId: number,
  eventId: number
): Promise<void> => {
  await client.delete(`/api/groups/${groupId}/events/${eventId}`)
}

