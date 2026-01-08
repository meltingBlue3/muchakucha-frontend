<template>
  <AppLayout>
    <div class="notes-view">
      <div class="page-header">
        <h2 class="page-title">笔记</h2>
        <button @click="handleShowCreateForm" class="btn-primary">
          创建笔记
        </button>
      </div>

      <!-- 笔记列表 -->
      <div class="notes-grid">
        <div
          v-for="note in notes"
          :key="note.id"
          class="note-card"
          @click="handleShowEditForm(note)"
        >
          <div class="note-header">
            <h3 class="note-title">{{ note.title }}</h3>
            <div class="note-actions" @click.stop>
              <button @click="handleDeleteNote(note.id)" class="btn-icon delete">删除</button>
            </div>
          </div>

          <p v-if="note.content" class="note-content">
            {{ truncateContent(note.content) }}
          </p>

          <div class="note-footer">
            <span class="note-date">{{ formatDate(note.updated_at) }}</span>
          </div>
        </div>

        <div v-if="notes.length === 0 && !loading" class="empty-state">
          <p>暂无笔记，点击上方按钮创建第一条笔记</p>
        </div>

        <div v-if="loading" class="loading-state">
          <p>加载中...</p>
        </div>
      </div>

      <!-- 创建/编辑笔记模态框 -->
      <div v-if="showNoteForm" class="modal-overlay" @click="handleCloseForm">
        <div class="modal-content" @click.stop>
          <h3 class="modal-title">{{ editingNote ? '编辑笔记' : '创建笔记' }}</h3>

          <form @submit.prevent="handleSubmitNote" class="form">
            <div class="form-group">
              <label for="title">标题</label>
              <input
                id="title"
                v-model="noteFormData.title"
                type="text"
                required
                placeholder="请输入笔记标题"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="content">内容</label>
              <textarea
                id="content"
                v-model="noteFormData.content"
                rows="12"
                placeholder="请输入笔记内容"
                class="form-input"
              ></textarea>
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
import * as noteApi from '@/api/notes'
import type { Note, NoteCreate } from '@/types'
import AppLayout from '@/components/layout/AppLayout.vue'

const groupStore = useGroupStore()

const notes = ref<Note[]>([])
const showNoteForm = ref(false)
const editingNote = ref<Note | null>(null)
const noteFormData = ref<NoteCreate>({
  title: '',
  content: ''
})

const loading = ref(false)
const submitting = ref(false)
const error = ref('')

onMounted(async () => {
  await loadNotes()
})

// 监听群组切换，自动刷新数据
watch(() => groupStore.currentGroupId, async (newGroupId, oldGroupId) => {
  // 只在群组真正改变时刷新（避免初始化时重复加载）
  if (newGroupId && newGroupId !== oldGroupId) {
    await loadNotes()
  }
})

const loadNotes = async () => {
  if (!groupStore.currentGroupId) return

  loading.value = true
  try {
    notes.value = await noteApi.getNotes(groupStore.currentGroupId)
  } catch (err: any) {
    error.value = err.message || '加载笔记列表失败'
    setTimeout(() => error.value = '', 3000)
  } finally {
    loading.value = false
  }
}

const handleShowCreateForm = () => {
  editingNote.value = null
  noteFormData.value = {
    title: '',
    content: ''
  }
  showNoteForm.value = true
}

const handleShowEditForm = (note: Note) => {
  editingNote.value = note
  noteFormData.value = {
    title: note.title,
    content: note.content || ''
  }
  showNoteForm.value = true
}

const handleCloseForm = () => {
  showNoteForm.value = false
  editingNote.value = null
}

const handleSubmitNote = async () => {
  if (!groupStore.currentGroupId) return

  submitting.value = true
  error.value = ''

  try {
    const data: NoteCreate = {
      title: noteFormData.value.title,
      content: noteFormData.value.content || null
    }

    if (editingNote.value) {
      // 编辑笔记
      await noteApi.updateNote(groupStore.currentGroupId, editingNote.value.id, data)
    } else {
      // 创建笔记
      await noteApi.createNote(groupStore.currentGroupId, data)
    }

    await loadNotes()
    handleCloseForm()
  } catch (err: any) {
    error.value = err.message || '保存笔记失败'
    setTimeout(() => error.value = '', 3000)
  } finally {
    submitting.value = false
  }
}

const handleDeleteNote = async (noteId: number) => {
  if (!groupStore.currentGroupId) return
  if (!confirm('确定要删除这条笔记吗？')) return

  try {
    await noteApi.deleteNote(groupStore.currentGroupId, noteId)
    await loadNotes()
  } catch (err: any) {
    error.value = err.message || '删除笔记失败'
    setTimeout(() => error.value = '', 3000)
  }
}

const truncateContent = (content: string | null) => {
  if (!content) return ''
  const maxLength = 150
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.notes-view {
  max-width: 1400px;
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

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.note-card {
  padding: 20px;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.note-card:hover {
  border-color: #4CAF50;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.note-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.note-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.note-card:hover .note-actions {
  opacity: 1;
}

.btn-icon {
  padding: 4px 10px;
  font-size: 12px;
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon.delete:hover {
  background-color: #ffebee;
  border-color: #f44336;
  color: #f44336;
}

.note-content {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
}

.note-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.note-date {
  font-size: 12px;
  color: #999;
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
  max-width: 700px;
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
  line-height: 1.6;
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
  grid-column: 1 / -1;
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

