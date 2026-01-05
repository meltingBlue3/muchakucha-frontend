import client from './client'
import type { Note, NoteCreate, NoteUpdate } from '@/types'

/**
 * 创建笔记
 */
export const createNote = async (
  groupId: number,
  data: NoteCreate
): Promise<Note> => {
  const response = await client.post<Note>(
    `/api/groups/${groupId}/notes`,
    data
  )
  return response.data
}

/**
 * 获取笔记列表
 */
export const getNotes = async (groupId: number): Promise<Note[]> => {
  const response = await client.get<Note[]>(`/api/groups/${groupId}/notes`)
  return response.data
}

/**
 * 获取笔记详情
 */
export const getNote = async (
  groupId: number,
  noteId: number
): Promise<Note> => {
  const response = await client.get<Note>(
    `/api/groups/${groupId}/notes/${noteId}`
  )
  return response.data
}

/**
 * 更新笔记
 */
export const updateNote = async (
  groupId: number,
  noteId: number,
  data: NoteUpdate
): Promise<Note> => {
  const response = await client.put<Note>(
    `/api/groups/${groupId}/notes/${noteId}`,
    data
  )
  return response.data
}

/**
 * 删除笔记
 */
export const deleteNote = async (
  groupId: number,
  noteId: number
): Promise<void> => {
  await client.delete(`/api/groups/${groupId}/notes/${noteId}`)
}

