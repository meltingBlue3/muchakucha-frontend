<template>
  <AppLayout>
    <div class="calendar-view">
      <div class="page-header">
        <h2 class="page-title">日历事件</h2>
        <div class="header-actions">
          <!-- 标签筛选 -->
          <LabelFilter v-model="filterLabelIds" @update:modelValue="loadEvents" />
          
          <!-- 视图切换按钮 -->
          <div class="view-toggle">
            <button
              :class="['toggle-btn', { active: viewMode === 'calendar' }]"
              @click="viewMode = 'calendar'"
            >
              日历视图
            </button>
            <button
              :class="['toggle-btn', { active: viewMode === 'list' }]"
              @click="viewMode = 'list'"
            >
              列表视图
            </button>
          </div>
          <button @click="handleShowCreateForm" class="btn-primary">
            创建事件
          </button>
        </div>
      </div>

      <!-- FullCalendar 日历视图 -->
      <div v-if="viewMode === 'calendar'" class="calendar-container">
        <FullCalendar :options="calendarOptions" />
      </div>

      <!-- 列表视图 -->
      <div v-else class="list-container">
        <EventListView
          :events="events"
          @edit="handleEditEvent"
          @delete="handleDeleteEvent"
        />
      </div>

      <!-- 事件表单弹窗 -->
      <EventFormModal
        v-model="showEventForm"
        :event="editingEvent"
        :initial-date="initialDate"
        :initial-end-date="initialEndDate"
        @submit="handleSubmitEvent"
      />

      <!-- 错误提示 -->
      <div v-if="error" class="error-toast">
        {{ error }}
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useGroupStore } from '@/stores/group'
import * as eventApi from '@/api/events'
import type { Event, EventCreate } from '@/types'
import AppLayout from '@/components/layout/AppLayout.vue'
import EventFormModal from '@/components/calendar/EventFormModal.vue'
import EventListView from '@/components/calendar/EventListView.vue'
import LabelFilter from '@/components/common/LabelFilter.vue'
import { getUserColor } from '@/utils/colors'
import { formatLocalTimeToISO } from '@/utils/datetime'

// FullCalendar imports
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { CalendarOptions, EventInput, DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'

const groupStore = useGroupStore()

const events = ref<Event[]>([])
const showEventForm = ref(false)
const editingEvent = ref<Event | null>(null)
const initialDate = ref<Date | null>(null)
const initialEndDate = ref<Date | null>(null)
const error = ref('')
const viewMode = ref<'calendar' | 'list'>('calendar')
const filterLabelIds = ref<number[]>([])

// 将 API Event 转换为 FullCalendar EventInput
const calendarEvents = computed<EventInput[]>(() => {
  return events.value.map(e => {
    const color = getUserColor(e.created_by)
    return {
      id: String(e.id),
      title: e.title,
      start: e.start_time,
      end: e.end_time,
      allDay: e.all_day,
      backgroundColor: color,
      borderColor: color,
      extendedProps: {
        description: e.description,
        location: e.location,
        created_by: e.created_by,
        created_at: e.created_at,
        updated_at: e.updated_at
      }
    }
  })
})

// FullCalendar 配置
const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  locale: 'zh-cn',
  buttonText: {
    today: '今天',
    month: '月',
    week: '周',
    day: '日'
  },
  events: calendarEvents.value,
  editable: true, // 允许拖拽编辑
  selectable: true, // 允许选择时间范围
  selectMirror: true,
  dayMaxEvents: true, // 当事件太多时显示 "+更多" 链接
  weekends: true,
  firstDay: 1, // 周一作为第一天
  
  // 事件处理
  dateClick: handleDateClick,
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventDrop: handleEventDrop,
  eventResize: handleEventResize,
  
  // 时间格式
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  },
  slotLabelFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }
}))

onMounted(async () => {
  await loadEvents()
})

// 监听群组切换，自动刷新数据
watch(() => groupStore.currentGroupId, async (newGroupId, oldGroupId) => {
  // 只在群组真正改变时刷新（避免初始化时重复加载）
  if (newGroupId && newGroupId !== oldGroupId) {
    await loadEvents()
  }
})

const loadEvents = async () => {
  if (!groupStore.currentGroupId) return

  try {
    events.value = await eventApi.getEvents(
      groupStore.currentGroupId,
      undefined,
      undefined,
      filterLabelIds.value.length > 0 ? filterLabelIds.value : undefined
    )
  } catch (err: any) {
    error.value = err.message || '加载事件列表失败'
    setTimeout(() => error.value = '', 3000)
  }
}

// 点击日期（单击）
const handleDateClick = (arg: any) => {
  // 注意：当启用 selectable 时，dateClick 可能不触发，因为用户会拖拽选择
  initialDate.value = arg.date
  initialEndDate.value = null
  editingEvent.value = null
  showEventForm.value = true
}

// 拖拽选择时间范围
const handleDateSelect = (selectInfo: DateSelectArg) => {
  initialDate.value = selectInfo.start
  initialEndDate.value = selectInfo.end
  editingEvent.value = null
  
  // 打开表单，预填选择的时间范围
  showEventForm.value = true
  
  // 清除选择（避免高亮保持）
  selectInfo.view.calendar.unselect()
}

// 点击事件
const handleEventClick = (clickInfo: EventClickArg) => {
  const eventId = Number(clickInfo.event.id)
  const event = events.value.find(e => e.id === eventId)
  
  if (event) {
    editingEvent.value = event
    initialDate.value = null
    initialEndDate.value = null
    showEventForm.value = true
  }
}

// 拖拽移动事件
const handleEventDrop = async (dropInfo: EventDropArg) => {
  if (!groupStore.currentGroupId) return
  
  const eventId = Number(dropInfo.event.id)
  const newStart = dropInfo.event.start
  const newEnd = dropInfo.event.end
  
  if (!newStart) {
    dropInfo.revert()
    return
  }
  
  try {
    await eventApi.updateEvent(groupStore.currentGroupId, eventId, {
      start_time: formatLocalTimeToISO(newStart),
      end_time: newEnd ? formatLocalTimeToISO(newEnd) : undefined
    })
    await loadEvents()
  } catch (err: any) {
    error.value = err.message || '更新事件失败'
    setTimeout(() => error.value = '', 3000)
    dropInfo.revert()
  }
}

// 调整事件大小（拖拽结束时间）
const handleEventResize = async (resizeInfo: EventResizeDoneArg) => {
  if (!groupStore.currentGroupId) return
  
  const eventId = Number(resizeInfo.event.id)
  const newEnd = resizeInfo.event.end
  
  if (!newEnd) {
    resizeInfo.revert()
    return
  }
  
  try {
    await eventApi.updateEvent(groupStore.currentGroupId, eventId, {
      end_time: formatLocalTimeToISO(newEnd)
    })
    await loadEvents()
  } catch (err: any) {
    error.value = err.message || '更新事件失败'
    setTimeout(() => error.value = '', 3000)
    resizeInfo.revert()
  }
}

// 显示创建表单
const handleShowCreateForm = () => {
  editingEvent.value = null
  initialDate.value = new Date()
  initialEndDate.value = null
  showEventForm.value = true
}

// 提交事件表单
const handleSubmitEvent = async (formData: EventCreate & { id?: number }) => {
  if (!groupStore.currentGroupId) return

  try {
    const data: EventCreate = {
      title: formData.title,
      description: formData.description || null,
      start_time: formatLocalTimeToISO(formData.start_time),
      end_time: formatLocalTimeToISO(formData.end_time),
      location: formData.location || null,
      all_day: formData.all_day,
      label_ids: formData.label_ids
    }

    if (formData.id) {
      // 编辑事件
      await eventApi.updateEvent(groupStore.currentGroupId, formData.id, data)
    } else {
      // 创建事件
      await eventApi.createEvent(groupStore.currentGroupId, data)
    }

    await loadEvents()
    showEventForm.value = false
  } catch (err: any) {
    error.value = err.message || '保存事件失败'
    setTimeout(() => error.value = '', 3000)
  }
}

// 编辑事件（从列表视图调用）
const handleEditEvent = (event: Event) => {
  editingEvent.value = event
  initialDate.value = null
  initialEndDate.value = null
  showEventForm.value = true
}

// 删除事件（从列表视图调用）
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
</script>

<style scoped>
.calendar-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-toggle {
  display: flex;
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 2px;
}

.toggle-btn {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  background-color: transparent;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  color: #333;
}

.toggle-btn.active {
  color: white;
  background-color: #4CAF50;
}

.btn-primary {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background-color: #4CAF50;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background-color: #45a049;
}

.calendar-container,
.list-container {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* FullCalendar 样式自定义 */
:deep(.fc) {
  font-family: inherit;
}

:deep(.fc .fc-button) {
  background-color: #4CAF50;
  border-color: #4CAF50;
  color: white;
  text-transform: none;
  font-weight: 500;
  padding: 6px 12px;
  font-size: 14px;
}

:deep(.fc .fc-button:hover) {
  background-color: #45a049;
  border-color: #45a049;
}

:deep(.fc .fc-button:disabled) {
  background-color: #ccc;
  border-color: #ccc;
}

:deep(.fc .fc-button-active) {
  background-color: #388E3C;
  border-color: #388E3C;
}

:deep(.fc-toolbar-title) {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

:deep(.fc-daygrid-day-number),
:deep(.fc-col-header-cell-cushion) {
  color: #333;
  text-decoration: none;
}

:deep(.fc-daygrid-day-number:hover) {
  color: #4CAF50;
}

:deep(.fc-day-today) {
  background-color: rgba(76, 175, 80, 0.1) !important;
}

:deep(.fc-event) {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
}

:deep(.fc-event:hover) {
  opacity: 0.9;
}

:deep(.fc-event-title) {
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .calendar-container {
    padding: 10px;
  }
  
  :deep(.fc-toolbar) {
    flex-direction: column;
    gap: 10px;
  }
  
  :deep(.fc-toolbar-chunk) {
    display: flex;
    justify-content: center;
  }
  
  :deep(.fc .fc-button) {
    padding: 4px 8px;
    font-size: 12px;
  }
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

