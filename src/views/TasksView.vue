<template>
  <AppLayout>
    <div class="tasks-view">
      <div class="page-header">
        <h2 class="page-title">任务管理</h2>
        <button @click="handleShowCreateForm" class="btn-primary">
          创建任务
        </button>
      </div>

      <!-- 筛选器 -->
      <div class="filters">
        <LabelFilter v-model="filterLabelIds" @update:modelValue="loadTasks" />
        <div class="filter-group">
          <label>状态：</label>
          <select v-model="filterStatus" @change="loadTasks" class="filter-select">
            <option value="">全部</option>
            <option value="pending">待处理</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
          </select>
        </div>

        <div class="filter-group">
          <label>优先级：</label>
          <select v-model="filterPriority" @change="loadTasks" class="filter-select">
            <option value="">全部</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="tasks-list">
        <div
          v-for="task in tasks"
          :key="task.id"
          class="task-card"
          :class="{ completed: task.status === 'completed' }"
        >
          <div class="task-header">
            <div class="task-title-row">
              <h3 class="task-title">{{ task.title }}</h3>
              <span class="priority-badge" :class="task.priority">
                {{ getPriorityLabel(task.priority) }}
              </span>
              <div v-if="task.labels && task.labels.length > 0" class="task-labels">
                <LabelBadge
                  v-for="label in task.labels"
                  :key="label.id"
                  :label="label"
                  :small="true"
                />
              </div>
            </div>
            <div class="task-actions">
              <button @click="handleShowEditForm(task)" class="btn-icon">编辑</button>
              <button @click="handleDeleteTask(task.id)" class="btn-icon delete">删除</button>
            </div>
          </div>

          <p v-if="task.description" class="task-description">
            {{ task.description }}
          </p>

          <div class="task-info">
            <div class="task-status">
              <span class="label">状态：</span>
              <select
                v-model="task.status"
                @change="handleUpdateTaskStatus(task)"
                class="status-select"
                :class="task.status"
              >
                <option value="pending">待处理</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
              </select>
            </div>

            <div v-if="task.due_date" class="task-due-date">
              <span class="label">截止日期：</span>
              <span>{{ formatDate(task.due_date) }}</span>
            </div>
          </div>
        </div>

        <div v-if="tasks.length === 0 && !loading" class="empty-state">
          <p>暂无任务，点击上方按钮创建第一个任务</p>
        </div>

        <div v-if="loading" class="loading-state">
          <p>加载中...</p>
        </div>
      </div>

      <!-- 创建/编辑任务模态框 -->
      <div v-if="showTaskForm" class="modal-overlay" @click="handleCloseForm">
        <div class="modal-content" @click.stop>
          <h3 class="modal-title">{{ editingTask ? '编辑任务' : '创建任务' }}</h3>

          <form @submit.prevent="handleSubmitTask" class="form">
            <div class="form-group">
              <label for="title">任务标题</label>
              <input
                id="title"
                v-model="taskFormData.title"
                type="text"
                required
                placeholder="请输入任务标题"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="description">描述</label>
              <textarea
                id="description"
                v-model="taskFormData.description"
                rows="3"
                placeholder="请输入任务描述"
                class="form-input"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="status">状态</label>
                <select
                  id="status"
                  v-model="taskFormData.status"
                  class="form-input"
                >
                  <option value="pending">待处理</option>
                  <option value="in_progress">进行中</option>
                  <option value="completed">已完成</option>
                </select>
              </div>

              <div class="form-group">
                <label for="priority">优先级</label>
                <select
                  id="priority"
                  v-model="taskFormData.priority"
                  class="form-input"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="due_date">截止日期</label>
              <input
                id="due_date"
                v-model="taskFormData.due_date"
                type="date"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>标签</label>
              <LabelInput :model-value="taskFormData.label_ids || []" @update:model-value="taskFormData.label_ids = $event" />
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
import { ref, onMounted, watch } from 'vue'
import { useGroupStore } from '@/stores/group'
import * as taskApi from '@/api/tasks'
import type { Task, TaskCreate } from '@/types'
import AppLayout from '@/components/layout/AppLayout.vue'
import LabelInput from '@/components/common/LabelInput.vue'
import LabelBadge from '@/components/common/LabelBadge.vue'
import LabelFilter from '@/components/common/LabelFilter.vue'

const groupStore = useGroupStore()

const tasks = ref<Task[]>([])
const showTaskForm = ref(false)
const editingTask = ref<Task | null>(null)
const taskFormData = ref<TaskCreate>({
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  due_date: '',
  label_ids: []
})

const filterStatus = ref('')
const filterPriority = ref('')
const filterLabelIds = ref<number[]>([])
const loading = ref(false)
const submitting = ref(false)
const error = ref('')

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
    error.value = err.message || '加载任务列表失败'
    setTimeout(() => error.value = '', 3000)
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
    due_date: '',
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
    due_date: task.due_date || '',
    label_ids: task.labels.map(label => label.id)
  }
  showTaskForm.value = true
}

const handleCloseForm = () => {
  showTaskForm.value = false
  editingTask.value = null
}

const handleSubmitTask = async () => {
  if (!groupStore.currentGroupId) return

  submitting.value = true
  error.value = ''

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
    } else {
      // 创建任务
      await taskApi.createTask(groupStore.currentGroupId, data)
    }

    await loadTasks()
    handleCloseForm()
  } catch (err: any) {
    error.value = err.message || '保存任务失败'
    setTimeout(() => error.value = '', 3000)
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
  } catch (err: any) {
    error.value = err.message || '更新任务状态失败'
    setTimeout(() => error.value = '', 3000)
  }
}

const handleDeleteTask = async (taskId: number) => {
  if (!groupStore.currentGroupId) return
  if (!confirm('确定要删除这个任务吗？')) return

  try {
    await taskApi.deleteTask(groupStore.currentGroupId, taskId)
    await loadTasks()
  } catch (err: any) {
    error.value = err.message || '删除任务失败'
    setTimeout(() => error.value = '', 3000)
  }
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高'
  }
  return labels[priority] || priority
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

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

.filter-select {
  padding: 6px 12px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  outline: none;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-card {
  padding: 20px;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-left: 4px solid #4CAF50;
  border-radius: 8px;
  transition: box-shadow 0.2s;
}

.task-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-card.completed {
  border-left-color: #9e9e9e;
  opacity: 0.8;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.task-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  flex-wrap: wrap;
}

.task-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.task-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.priority-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.priority-badge.high {
  background-color: #ffebee;
  color: #c62828;
}

.priority-badge.medium {
  background-color: #fff3e0;
  color: #ef6c00;
}

.priority-badge.low {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.task-actions {
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

.task-description {
  margin: 0 0 12px;
  font-size: 14px;
  color: #666;
}

.task-info {
  display: flex;
  gap: 20px;
  align-items: center;
  font-size: 14px;
}

.task-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: #333;
}

.status-select {
  padding: 4px 8px;
  font-size: 13px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  outline: none;
}

.status-select.completed {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-select.in_progress {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status-select.pending {
  background-color: #fff3e0;
  color: #ef6c00;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

