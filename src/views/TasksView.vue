<template>
  <AppLayout>
    <div class="tasks-view">
      <n-space justify="space-between" align="center" style="margin-bottom: 24px;">
        <n-text tag="h2" style="font-size: 24px; font-weight: 600; margin: 0;">
          任务管理
        </n-text>
        <n-button type="primary" @click="handleShowCreateForm">
          创建任务
        </n-button>
      </n-space>

      <!-- 筛选器 -->
      <n-card :bordered="false" style="margin-bottom: 16px;">
        <n-space align="center">
          <LabelFilter v-model="filterLabelIds" @update:modelValue="loadTasks" />
          
          <n-text depth="3">状态：</n-text>
          <n-select
            v-model:value="filterStatus"
            :options="statusOptions"
            @update:value="loadTasks"
            style="width: 140px;"
          />

          <n-text depth="3">优先级：</n-text>
          <n-select
            v-model:value="filterPriority"
            :options="priorityOptions"
            @update:value="loadTasks"
            style="width: 140px;"
          />
        </n-space>
      </n-card>

      <!-- 任务列表 -->
      <n-space vertical size="large">
        <n-card
          v-for="task in tasks"
          :key="task.id"
          :bordered="true"
          hoverable
        >
          <template #header>
            <n-space align="center" justify="space-between">
              <n-space align="center">
                <n-text strong style="font-size: 18px;">{{ task.title }}</n-text>
                <n-tag :type="getPriorityType(task.priority)" size="small">
                  {{ getPriorityLabel(task.priority) }}
                </n-tag>
                <n-space v-if="task.labels && task.labels.length > 0" size="small">
                  <LabelBadge
                    v-for="label in task.labels"
                    :key="label.id"
                    :label="label"
                    :small="true"
                  />
                </n-space>
              </n-space>
              
              <n-space>
                <n-button size="small" @click="handleShowEditForm(task)">
                  编辑
                </n-button>
                <n-button size="small" type="error" secondary @click="handleDeleteTask(task.id)">
                  删除
                </n-button>
              </n-space>
            </n-space>
          </template>

          <n-text v-if="task.description" depth="3" style="display: block; margin-bottom: 12px;">
            {{ task.description }}
          </n-text>

          <n-space align="center">
            <n-text depth="3" strong>状态：</n-text>
            <n-select
              v-model:value="task.status"
              :options="statusOptions"
              @update:value="handleUpdateTaskStatus(task)"
              style="width: 120px;"
              size="small"
            />

            <n-text v-if="task.due_date" depth="3" strong style="margin-left: 16px;">
              截止日期：
            </n-text>
            <n-text v-if="task.due_date" depth="3">
              {{ formatDate(task.due_date) }}
            </n-text>
          </n-space>
        </n-card>
      </n-space>

      <n-empty
        v-if="tasks.length === 0 && !loading"
        description="暂无任务，点击上方按钮创建第一个任务"
        style="margin-top: 60px;"
      />

      <n-spin v-if="loading" style="width: 100%; margin-top: 60px;" />

      <!-- 创建/编辑任务模态框 -->
      <n-modal
        v-model:show="showTaskForm"
        preset="card"
        :title="editingTask ? '编辑任务' : '创建任务'"
        style="width: 600px;"
        :segmented="{
          content: 'soft',
          footer: 'soft'
        }"
      >
        <n-form
          ref="formRef"
          :model="taskFormData"
          :rules="taskRules"
          label-placement="top"
        >
          <n-form-item path="title" label="任务标题">
            <n-input
              v-model:value="taskFormData.title"
              placeholder="请输入任务标题"
            />
          </n-form-item>

          <n-form-item path="description" label="描述">
            <n-input
              v-model:value="taskFormData.description"
              type="textarea"
              :rows="3"
              placeholder="请输入任务描述"
            />
          </n-form-item>

          <n-grid :cols="2" :x-gap="16">
            <n-grid-item>
              <n-form-item path="status" label="状态">
                <n-select
                  v-model:value="taskFormData.status"
                  :options="statusOptions"
                />
              </n-form-item>
            </n-grid-item>

            <n-grid-item>
              <n-form-item path="priority" label="优先级">
                <n-select
                  v-model:value="taskFormData.priority"
                  :options="priorityOptions"
                />
              </n-form-item>
            </n-grid-item>
          </n-grid>

          <n-form-item path="due_date" label="截止日期">
            <n-date-picker
              v-model:formatted-value="taskFormData.due_date"
              type="date"
              format="yyyy-MM-dd"
              style="width: 100%;"
              clearable
            />
          </n-form-item>

          <n-form-item label="标签">
            <LabelInput 
              :model-value="taskFormData.label_ids || []" 
              @update:model-value="taskFormData.label_ids = $event" 
            />
          </n-form-item>
        </n-form>

        <template #footer>
          <n-space justify="end">
            <n-button @click="handleCloseForm">
              取消
            </n-button>
            <n-button 
              type="primary" 
              :loading="submitting"
              :disabled="submitting"
              @click="handleSubmitTask"
            >
              {{ submitting ? '保存中...' : '保存' }}
            </n-button>
          </n-space>
        </template>
      </n-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useGroupStore } from '@/stores/group'
import * as taskApi from '@/api/tasks'
import type { Task, TaskCreate } from '@/types'
import AppLayout from '@/components/layout/AppLayout.vue'
import LabelInput from '@/components/common/LabelInput.vue'
import LabelBadge from '@/components/common/LabelBadge.vue'
import LabelFilter from '@/components/common/LabelFilter.vue'
import { 
  NCard, 
  NSpace, 
  NText, 
  NButton, 
  NTag,
  NSelect,
  NEmpty,
  NSpin,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NDatePicker,
  NGrid,
  NGridItem,
  useMessage,
  useDialog,
  type FormInst,
  type FormRules,
  type SelectOption
} from 'naive-ui'

const groupStore = useGroupStore()
const message = useMessage()
const dialog = useDialog()

const tasks = ref<Task[]>([])
const showTaskForm = ref(false)
const editingTask = ref<Task | null>(null)
const formRef = ref<FormInst | null>(null)
const taskFormData = ref<TaskCreate>({
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  due_date: null,
  label_ids: []
})

const filterStatus = ref('')
const filterPriority = ref('')
const filterLabelIds = ref<number[]>([])
const loading = ref(false)
const submitting = ref(false)

const statusOptions: SelectOption[] = [
  { label: '全部', value: '' },
  { label: '待处理', value: 'pending' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' }
]

const priorityOptions: SelectOption[] = [
  { label: '全部', value: '' },
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' }
]

const taskRules: FormRules = {
  title: [
    {
      required: true,
      message: '请输入任务标题',
      trigger: ['blur', 'input']
    }
  ]
}

onMounted(async () => {
  await loadTasks()
})

// 监听群组切换，自动刷新数据
watch(() => groupStore.currentGroupId, async (newGroupId, oldGroupId) => {
  // 只在群组真正改变时刷新（避免初始化时重复加载）
  if (newGroupId && newGroupId !== oldGroupId) {
    // 重置筛选条件
    filterStatus.value = ''
    filterPriority.value = ''
    filterLabelIds.value = []
    await loadTasks()
  }
})

const loadTasks = async () => {
  if (!groupStore.currentGroupId) return

  loading.value = true
  try {
    tasks.value = await taskApi.getTasks(
      groupStore.currentGroupId,
      filterStatus.value || undefined,
      filterPriority.value || undefined,
      filterLabelIds.value.length > 0 ? filterLabelIds.value : undefined
    )
  } catch (err: any) {
    message.error(err.message || '加载任务列表失败')
  } finally {
    loading.value = false
  }
}

const handleShowCreateForm = () => {
  editingTask.value = null
  taskFormData.value = {
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: null,
    label_ids: []
  }
  showTaskForm.value = true
}

const handleShowEditForm = (task: Task) => {
  editingTask.value = task
  taskFormData.value = {
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    due_date: task.due_date || null,
    label_ids: task.labels.map(label => label.id)
  }
  showTaskForm.value = true
}

const handleCloseForm = () => {
  showTaskForm.value = false
  editingTask.value = null
}

const handleSubmitTask = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  if (!groupStore.currentGroupId) return

  submitting.value = true

  try {
    const data: TaskCreate = {
      title: taskFormData.value.title,
      description: taskFormData.value.description || null,
      status: taskFormData.value.status,
      priority: taskFormData.value.priority,
      due_date: taskFormData.value.due_date || null,
      label_ids: taskFormData.value.label_ids
    }

    if (editingTask.value) {
      // 编辑任务
      await taskApi.updateTask(groupStore.currentGroupId, editingTask.value.id, data)
      message.success('任务已更新')
    } else {
      // 创建任务
      await taskApi.createTask(groupStore.currentGroupId, data)
      message.success('任务已创建')
    }

    await loadTasks()
    handleCloseForm()
  } catch (err: any) {
    message.error(err.message || '保存任务失败')
  } finally {
    submitting.value = false
  }
}

const handleUpdateTaskStatus = async (task: Task) => {
  if (!groupStore.currentGroupId) return

  try {
    await taskApi.updateTask(groupStore.currentGroupId, task.id, {
      status: task.status
    })
    await loadTasks()
    message.success('状态已更新')
  } catch (err: any) {
    message.error(err.message || '更新任务状态失败')
  }
}

const handleDeleteTask = async (taskId: number) => {
  if (!groupStore.currentGroupId) return

  dialog.warning({
    title: '确认删除',
    content: '确定要删除这个任务吗？',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await taskApi.deleteTask(groupStore.currentGroupId!, taskId)
        await loadTasks()
        message.success('任务已删除')
      } catch (err: any) {
        message.error(err.message || '删除任务失败')
      }
    }
  })
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高'
  }
  return labels[priority] || priority
}

const getPriorityType = (priority: string) => {
  const types: Record<string, 'success' | 'warning' | 'error'> = {
    low: 'success',
    medium: 'warning',
    high: 'error'
  }
  return types[priority] || 'default'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.tasks-view {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
