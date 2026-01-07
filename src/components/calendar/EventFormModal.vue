<template>
  <div v-if="modelValue" class="modal-overlay" @click="handleClose">
    <div class="modal-content" @click.stop>
      <h3 class="modal-title">{{ event ? '编辑事件' : '创建事件' }}</h3>

      <form @submit.prevent="handleSubmit" class="form">
        <div class="form-group">
          <label for="title">标题</label>
          <input
            id="title"
            v-model="formData.title"
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
            v-model="formData.description"
            rows="3"
            placeholder="请输入事件描述"
            class="form-input"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="start_time">开始时间</label>
          <input
            id="start_time"
            v-model="formData.start_time"
            type="datetime-local"
            required
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="end_time">结束时间</label>
          <input
            id="end_time"
            v-model="formData.end_time"
            type="datetime-local"
            required
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="location">地点</label>
          <input
            id="location"
            v-model="formData.location"
            type="text"
            placeholder="请输入事件地点"
            class="form-input"
          />
        </div>

        <div class="form-group checkbox">
          <label>
            <input
              v-model="formData.all_day"
              type="checkbox"
            />
            全天事件
          </label>
        </div>

        <div class="form-group">
          <label>标签</label>
          <LabelInput v-model="formData.label_ids" />
        </div>

        <div class="form-actions">
          <button type="button" @click="handleClose" class="btn-secondary">
            取消
          </button>
          <button type="submit" :disabled="submitting" class="btn-primary">
            {{ submitting ? '保存中...' : '保存' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Event, EventCreate } from '@/types'
import LabelInput from '@/components/common/LabelInput.vue'

interface Props {
  modelValue: boolean
  event?: Event | null
  initialDate?: Date | null
  initialEndDate?: Date | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: EventCreate & { id?: number }): void
}

const props = withDefaults(defineProps<Props>(), {
  event: null,
  initialDate: null,
  initialEndDate: null
})

const emit = defineEmits<Emits>()

const submitting = ref(false)
const formData = ref<EventCreate & { id?: number }>({
  title: '',
  description: '',
  start_time: '',
  end_time: '',
  location: '',
  all_day: false,
  label_ids: []
})

// 监听 props 变化，初始化表单数据
watch(
  () => [props.modelValue, props.event, props.initialDate, props.initialEndDate],
  () => {
    if (props.modelValue) {
      if (props.event) {
        // 编辑模式：填充事件数据
        formData.value = {
          id: props.event.id,
          title: props.event.title,
          description: props.event.description || '',
          start_time: formatDateTimeForInput(props.event.start_time),
          end_time: formatDateTimeForInput(props.event.end_time),
          location: props.event.location || '',
          all_day: props.event.all_day,
          label_ids: props.event.labels.map(label => label.id)
        }
      } else {
        // 创建模式：重置表单，可能包含初始日期
        const startTime = props.initialDate || new Date()
        const endTime = props.initialEndDate || (() => {
          const end = new Date(startTime)
          end.setHours(end.getHours() + 1)
          return end
        })()

        formData.value = {
          title: '',
          description: '',
          start_time: formatDateTimeForInput(startTime.toISOString()),
          end_time: formatDateTimeForInput(endTime.toISOString()),
          location: '',
          all_day: false,
          label_ids: []
        }
      }
    }
  },
  { immediate: true }
)

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleSubmit = () => {
  submitting.value = true
  emit('submit', formData.value)
}

// 重置 submitting 状态（父组件需要在提交成功后关闭弹窗）
watch(
  () => props.modelValue,
  (newVal) => {
    if (!newVal) {
      submitting.value = false
    }
  }
)

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
</style>

