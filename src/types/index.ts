// ============================================================================
// 基础类型定义（基于 OpenAPI schemas）
// ============================================================================

// User 相关类型
export interface User {
  id: number
  email: string
  nickname: string
  created_at: string
  updated_at: string
}

export interface UserCreate {
  email: string
  nickname: string
  password: string
}

export interface UserUpdate {
  nickname?: string | null
}

// 认证相关类型
export interface LoginRequest {
  email: string
  password: string
}

export interface Token {
  access_token: string
  token_type: string
}

// Group 相关类型
export interface Group {
  id: number
  name: string
  description: string | null
  created_by: number
  created_at: string
  updated_at: string
}

export interface GroupCreate {
  name: string
  description?: string | null
}

export interface GroupUpdate {
  name?: string | null
  description?: string | null
}

export interface GroupMemberAdd {
  email: string
  role?: string
}

export interface GroupMemberUpdate {
  role: string
}

export interface GroupMemberDetail {
  id: number
  group_id: number
  user_id: number
  role: string
  joined_at: string
  user_email: string
  user_nickname: string
}

// Label 相关类型
export interface Label {
  id: number
  group_id: number
  name: string
  color: string
  created_at: string
  updated_at: string
}

export interface LabelBasic {
  id: number
  name: string
  color: string
}

export interface LabelCreate {
  name: string
  color?: string
}

export interface LabelUpdate {
  name?: string | null
  color?: string | null
}

export interface LabelWithStats extends Label {
  event_count: number
  task_count: number
}

// Event 相关类型
export interface Event {
  id: number
  group_id: number
  title: string
  description: string | null
  start_time: string
  end_time: string
  all_day: boolean
  location: string | null
  created_by: number
  created_at: string
  updated_at: string
  labels: LabelBasic[]
}

export interface EventCreate {
  title: string
  description?: string | null
  start_time: string
  end_time: string
  all_day?: boolean
  location?: string | null
  label_ids?: number[]
}

export interface EventUpdate {
  title?: string | null
  description?: string | null
  start_time?: string | null
  end_time?: string | null
  all_day?: boolean | null
  location?: string | null
  label_ids?: number[] | null
}

// Task 相关类型
export interface Task {
  id: number
  group_id: number
  title: string
  description: string | null
  due_date: string | null
  status: string
  priority: string
  assigned_to: number | null
  created_by: number
  created_at: string
  updated_at: string
  labels: LabelBasic[]
}

export interface TaskCreate {
  title: string
  description?: string | null
  due_date?: string | null
  status?: string
  priority?: string
  assigned_to?: number | null
  label_ids?: number[]
}

export interface TaskUpdate {
  title?: string | null
  description?: string | null
  due_date?: string | null
  status?: string | null
  priority?: string | null
  assigned_to?: number | null
  label_ids?: number[] | null
}

// Note 相关类型
export interface Note {
  id: number
  group_id: number
  title: string
  content: string | null
  created_by: number
  created_at: string
  updated_at: string
}

export interface NoteCreate {
  title: string
  content?: string | null
}

export interface NoteUpdate {
  title?: string | null
  content?: string | null
}

// API 错误响应类型
export interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface HTTPValidationError {
  detail: ValidationError[]
}

// API 通用响应类型
export interface ApiError {
  message: string
  detail?: unknown
}

