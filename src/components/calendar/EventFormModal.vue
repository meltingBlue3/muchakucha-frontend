<template>
  <n-modal
    v-model:show="showModal"
    preset="card"
    :title="event ? '编辑事件' : '创建事件'"
    style="width: 600px;"
    :segmented="{
      content: 'soft',
      footer: 'soft'
    }"
    @after-leave="handleAfterLeave"
  >
    <n-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-placement="top"
      label-width="auto"
    >
      <n-form-item path="title" label="标题">
        <n-input
          v-model:value="formData.title"
          placeholder="请输入事件标题"
        />
      </n-form-item>

      <n-form-item path="description" label="描述">
        <n-input
          v-model:value="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入事件描述"
        />
      </n-form-item>

      <n-grid :cols="2" :x-gap="16">
        <n-grid-item>
          <n-form-item path="start_time" label="开始时间">
            <n-date-picker
              v-model:formatted-value="formData.start_time"
              type="datetime"
              format="yyyy-MM-dd HH:mm"
              value-format="yyyy-MM-dd'T'HH:mm"
              style="width: 100%;"
            />
          </n-form-item>
        </n-grid-item>
        
        <n-grid-item>
          <n-form-item path="end_time" label="结束时间">
            <n-date-picker
              v-model:formatted-value="formData.end_time"
              type="datetime"
              format="yyyy-MM-dd HH:mm"
              value-format="yyyy-MM-dd'T'HH:mm"
              style="width: 100%;"
            />
          </n-form-item>
        </n-grid-item>
      </n-grid>

      <n-form-item path="location" label="地点">
        <n-input
          v-model:value="formData.location"
          placeholder="请输入事件地点"
        />
      </n-form-item>

      <n-form-item path="all_day" label="全天事件">
        <n-switch v-model:value="formData.all_day" />
      </n-form-item>

      <n-form-item label="标签">
        <LabelInput 
          :model-value="formData.label_ids || []" 
          @update:model-value="formData.label_ids = $event" 
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-space justify="end">
        <n-button @click="handleClose">
          取消
        </n-button>
        <n-button 
          type="primary" 
          :loading="submitting"
          :disabled="submitting"
          @click="handleSubmit"
        >
          {{ submitting ? '保存中...' : '保存' }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Event, EventCreate } from '@/types'
import { 
  NModal, 
  NForm, 
  NFormItem, 
  NInput, 
  NDatePicker, 
  NSwitch, 
  NButton,
  NSpace,
  NGrid,
  NGridItem,
  type FormInst,
  type FormRules
} from 'naive-ui'
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

const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref<FormInst | null>(null)
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

const rules: FormRules = {
  title: [
    {
      required: true,
      message: '请输入事件标题',
      trigger: ['blur', 'input']
    }
  ],
  start_time: [
    {
      required: true,
      message: '请选择开始时间',
      trigger: ['blur', 'change']
    }
  ],
  end_time: [
    {
      required: true,
      message: '请选择结束时间',
      trigger: ['blur', 'change']
    }
  ]
}

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

const handleAfterLeave = () => {
  submitting.value = false
  formRef.value?.restoreValidation()
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

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
