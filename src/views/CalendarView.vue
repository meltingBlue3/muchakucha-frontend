<template>
  <AppLayout>
    <div class="calendar-view">
      <div class="page-header">
        <h2 class="page-title">日历事件</h2>
        <button @click="handleShowCreateForm" class="btn-primary">
          创建事件
        </button>
      </div>

      <!-- 事件列表 -->
      <div class="events-list">
        <div
          v-for="event in events"
          :key="event.id"
          class="event-card"
        >
          <div class="event-header">
            <h3 class="event-title">{{ event.title }}</h3>
            <div class="event-actions">
              <button @click="handleShowEditForm(event)" class="btn-icon">编辑</button>
              <button @click="handleDeleteEvent(event.id)" class="btn-icon delete">删除</button>
            </div>
          </div>

          <p v-if="event.description" class="event-description">
            {{ event.description }}
          </p>

          <div class="event-info">
            <div class="event-time">
              <span class="label">开始：</span>
              <span>{{ formatDateTime(event.start_time) }}</span>
            </div>
            <div class="event-time">
              <span class="label">结束：</span>
              <span>{{ formatDateTime(event.end_time) }}</span>
            </div>
            <div v-if="event.location" class="event-location">
              <span class="label">地点：</span>
              <span>{{ event.location }}</span>
            </div>
            <div v-if="event.all_day" class="event-badge">全天事件</div>
          </div>
        </div>

        <div v-if="events.length === 0 && !loading" class="empty-state">
          <p>暂无事件，点击上方按钮创建第一个事件</p>
        </div>

        <div v-if="loading" class="loading-state">
          <p>加载中...</p>
        </div>
      </div>

      <!-- 创建/编辑事件模态框 -->
      <div v-if="showEventForm" class="modal-overlay" @click="handleCloseForm">
        <div class="modal-content" @click.stop>
          <h3 class="modal-title">{{ editingEvent ? '编辑事件' : '创建事件' }}</h3>

          <form @submit.prevent="handleSubmitEvent" class="form">
            <div class="form-group">
              <label for="title">标题</label>
              <input
                id="title"
                v-model="eventFormData.title"
                type="text"
                required
                placeholder="请输入事件标题"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="description">描述</label>
              <textarea
                id="description"
                v-model="eventFormData.description"
                rows="3"
                placeholder="请输入事件描述"
                class="form-input"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="start_time">开始时间</label>
              <input
                id="start_time"
                v-model="eventFormData.start_time"
                type="datetime-local"
                required
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="end_time">结束时间</label>
              <input
                id="end_time"
                v-model="eventFormData.end_time"
                type="datetime-local"
                required
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="location">地点</label>
              <input
                id="location"
                v-model="eventFormData.location"
                type="text"
                placeholder="请输入事件地点"
                class="form-input"
              />
            </div>

            <div class="form-group checkbox">
              <label>
                <input
                  v-model="eventFormData.all_day"
                  type="checkbox"
                />
                全天事件
              </label>
            </div>

            <div class="form-actions">
              <button type="button" @click="handleCloseForm" class="btn-secondary">
                取消
              </button>
              <button type="submit" :disabled="submitting" class="btn-primary">
                {{ submitting ? '保存中...' : '保存' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="error" class="error-toast">
        {{ error }}
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGroupStore } from '@/stores/group'
import * as eventApi from '@/api/events'
import type { Event, EventCreate } from '@/types'
import AppLayout from '@/components/layout/AppLayout.vue'

const groupStore = useGroupStore()

const events = ref<Event[]>([])
const showEventForm = ref(false)
const editingEvent = ref<Event | null>(null)
const eventFormData = ref<EventCreate & { id?: number }>({
  title: '',
  description: '',
  start_time: '',
  end_time: '',
  location: '',
  all_day: false
})

const loading = ref(false)
const submitting = ref(false)
const error = ref('')

onMounted(async () => {
  await loadEvents()
})

const loadEvents = async () => {
  if (!groupStore.currentGroupId) return

  loading.value = true
  try {
    events.value = await eventApi.getEvents(groupStore.currentGroupId)
  } catch (err: any) {
    error.value = err.message || '加载事件列表失败'
    setTimeout(() => error.value = '', 3000)
  } finally {
    loading.value = false
  }
}

const handleShowCreateForm = () => {
  editingEvent.value = null
  eventFormData.value = {
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    all_day: false
  }
  showEventForm.value = true
}

const handleShowEditForm = (event: Event) => {
  editingEvent.value = event
  eventFormData.value = {
    title: event.title,
    description: event.description || '',
    start_time: formatDateTimeForInput(event.start_time),
    end_time: formatDateTimeForInput(event.end_time),
    location: event.location || '',
    all_day: event.all_day
  }
  showEventForm.value = true
}

const handleCloseForm = () => {
  showEventForm.value = false
  editingEvent.value = null
}

const handleSubmitEvent = async () => {
  if (!groupStore.currentGroupId) return

  submitting.value = true
  error.value = ''

  try {
    const data: EventCreate = {
      title: eventFormData.value.title,
      description: eventFormData.value.description || null,
      start_time: new Date(eventFormData.value.start_time).toISOString(),
      end_time: new Date(eventFormData.value.end_time).toISOString(),
      location: eventFormData.value.location || null,
      all_day: eventFormData.value.all_day
    }

    if (editingEvent.value) {
      // 编辑事件
      await eventApi.updateEvent(groupStore.currentGroupId, editingEvent.value.id, data)
    } else {
      // 创建事件
      await eventApi.createEvent(groupStore.currentGroupId, data)
    }

    await loadEvents()
    handleCloseForm()
  } catch (err: any) {
    error.value = err.message || '保存事件失败'
    setTimeout(() => error.value = '', 3000)
  } finally {
    submitting.value = false
  }
}

const handleDeleteEvent = async (eventId: number) => {
  if (!groupStore.currentGroupId) return
  if (!confirm('确定要删除这个事件吗？')) return

  try {
    await eventApi.deleteEvent(groupStore.currentGroupId, eventId)
    await loadEvents()
  } catch (err: any) {
    error.value = err.message || '删除事件失败'
    setTimeout(() => error.value = '', 3000)
  }
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDateTimeForInput = (dateString: string) => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}
</script>

<style scoped>
.calendar-view {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.event-card {
  padding: 20px;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: box-shadow 0.2s;
}

.event-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.event-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.event-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  padding: 6px 12px;
  font-size: 12px;
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background-color: #f5f5f5;
}

.btn-icon.delete:hover {
  background-color: #ffebee;
  border-color: #f44336;
  color: #f44336;
}

.event-description {
  margin: 0 0 12px;
  font-size: 14px;
  color: #666;
}

.event-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 14px;
  color: #555;
}

.label {
  font-weight: 500;
  color: #333;
  margin-right: 4px;
}

.event-badge {
  padding: 4px 12px;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 12px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.modal-title {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.checkbox {
  flex-direction: row;
  align-items: center;
}

.form-group.checkbox label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

.form-input {
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

textarea.form-input {
  resize: vertical;
  font-family: inherit;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  color: white;
  background-color: #4CAF50;
}

.btn-primary:hover:not(:disabled) {
  background-color: #45a049;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  color: #333;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background-color: #e8e8e8;
}

.empty-state,
.loading-state {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.error-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 24px;
  background-color: #f44336;
  color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1001;
}
</style>

