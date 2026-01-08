<template>
  <AppLayout>
    <div class="calendar-view">
      <n-space justify="space-between" align="center" style="margin-bottom: 24px;">
        <n-text tag="h2" style="font-size: 24px; font-weight: 600; margin: 0;">
          日历事件
        </n-text>
        
        <n-space align="center">
          <!-- 标签筛选 -->
          <LabelFilter v-model="filterLabelIds" @update:modelValue="loadEvents" />
          
          <!-- 视图切换 -->
          <n-button-group>
            <n-button
              :type="viewMode === 'calendar' ? 'primary' : 'default'"
              @click="viewMode = 'calendar'"
            >
              日历视图
            </n-button>
            <n-button
              :type="viewMode === 'list' ? 'primary' : 'default'"
              @click="viewMode = 'list'"
            >
              列表视图
            </n-button>
          </n-button-group>
          
          <n-button type="primary" @click="handleShowCreateForm">
            创建事件
          </n-button>
        </n-space>
      </n-space>

      <!-- FullCalendar 日历视图 -->
      <n-card v-if="viewMode === 'calendar'" :bordered="false">
        <FullCalendar :options="calendarOptions" />
      </n-card>

      <!-- 列表视图 -->
      <n-card v-else :bordered="false">
        <EventListView
          :events="events"
          @edit="handleEditEvent"
          @delete="handleDeleteEvent"
        />
      </n-card>

      <!-- 事件表单弹窗 -->
      <EventFormModal
        v-model="showEventForm"
        :event="editingEvent"
        :initial-date="initialDate"
        :initial-end-date="initialEndDate"
        @submit="handleSubmitEvent"
      />
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
import { 
  NCard, 
  NSpace, 
  NText, 
  NButton, 
  NButtonGroup,
  useMessage,
  useDialog
} from 'naive-ui'

// FullCalendar imports
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { CalendarOptions, EventInput, DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'

const groupStore = useGroupStore()
const message = useMessage()
const dialog = useDialog()

const events = ref<Event[]>([])
const showEventForm = ref(false)
const editingEvent = ref<Event | null>(null)
const initialDate = ref<Date | null>(null)
const initialEndDate = ref<Date | null>(null)
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
    message.error(err.message || '加载事件列表失败')
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
    message.success('事件已更新')
  } catch (err: any) {
    message.error(err.message || '更新事件失败')
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
    message.success('事件已更新')
  } catch (err: any) {
    message.error(err.message || '更新事件失败')
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
      message.success('事件已更新')
    } else {
      // 创建事件
      await eventApi.createEvent(groupStore.currentGroupId, data)
      message.success('事件已创建')
    }

    await loadEvents()
    showEventForm.value = false
  } catch (err: any) {
    message.error(err.message || '保存事件失败')
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

  dialog.warning({
    title: '确认删除',
    content: '确定要删除这个事件吗？',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await eventApi.deleteEvent(groupStore.currentGroupId!, eventId)
        await loadEvents()
        message.success('事件已删除')
      } catch (err: any) {
        message.error(err.message || '删除事件失败')
      }
    }
  })
}
</script>

<style scoped>
.calendar-view {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
