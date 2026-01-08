<template>
  <AppLayout>
    <div class="notes-view">
      <n-space justify="space-between" align="center" style="margin-bottom: 24px;">
        <n-text tag="h2" style="font-size: 24px; font-weight: 600; margin: 0;">
          笔记
        </n-text>
        <n-button type="primary" @click="handleShowCreateForm">
          创建笔记
        </n-button>
      </n-space>

      <!-- 笔记网格 -->
      <n-grid :cols="3" :x-gap="16" :y-gap="16" responsive="screen">
        <n-grid-item v-for="note in notes" :key="note.id">
          <n-card
            :title="note.title"
            :bordered="true"
            hoverable
            @click="handleShowEditForm(note)"
            style="cursor: pointer; height: 240px; display: flex; flex-direction: column;"
            :content-style="{ flex: 1, overflow: 'hidden' }"
          >
            <template #header-extra>
              <n-button
                text
                size="small"
                type="error"
                @click.stop="handleDeleteNote(note.id)"
              >
                删除
              </n-button>
            </template>

            <n-text
              v-if="note.content"
              depth="3"
              style="display: block; white-space: pre-wrap; word-break: break-word; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical;"
            >
              {{ truncateContent(note.content) }}
            </n-text>

            <template #footer>
              <n-text depth="3" style="font-size: 12px;">
                {{ formatDate(note.updated_at) }}
              </n-text>
            </template>
          </n-card>
        </n-grid-item>
      </n-grid>

      <n-empty
        v-if="notes.length === 0 && !loading"
        description="暂无笔记，点击上方按钮创建第一条笔记"
        style="margin-top: 60px;"
      />

      <n-spin v-if="loading" style="width: 100%; margin-top: 60px;" />

      <!-- 创建/编辑笔记模态框 -->
      <n-modal
        v-model:show="showNoteForm"
        preset="card"
        :title="editingNote ? '编辑笔记' : '创建笔记'"
        style="width: 700px;"
        :segmented="{
          content: 'soft',
          footer: 'soft'
        }"
      >
        <n-form
          ref="formRef"
          :model="noteFormData"
          :rules="noteRules"
          label-placement="top"
        >
          <n-form-item path="title" label="标题">
            <n-input
              v-model:value="noteFormData.title"
              placeholder="请输入笔记标题"
            />
          </n-form-item>

          <n-form-item path="content" label="内容">
            <n-input
              v-model:value="noteFormData.content"
              type="textarea"
              :rows="12"
              placeholder="请输入笔记内容"
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
              @click="handleSubmitNote"
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
import * as noteApi from '@/api/notes'
import type { Note, NoteCreate } from '@/types'
import AppLayout from '@/components/layout/AppLayout.vue'
import { 
  NCard, 
  NSpace, 
  NText, 
  NButton,
  NGrid,
  NGridItem,
  NEmpty,
  NSpin,
  NModal,
  NForm,
  NFormItem,
  NInput,
  useMessage,
  useDialog,
  type FormInst,
  type FormRules
} from 'naive-ui'

const groupStore = useGroupStore()
const message = useMessage()
const dialog = useDialog()

const notes = ref<Note[]>([])
const showNoteForm = ref(false)
const editingNote = ref<Note | null>(null)
const formRef = ref<FormInst | null>(null)
const noteFormData = ref<NoteCreate>({
  title: '',
  content: ''
})

const loading = ref(false)
const submitting = ref(false)

const noteRules: FormRules = {
  title: [
    {
      required: true,
      message: '请输入笔记标题',
      trigger: ['blur', 'input']
    }
  ]
}

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
    message.error(err.message || '加载笔记列表失败')
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
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  if (!groupStore.currentGroupId) return

  submitting.value = true

  try {
    const data: NoteCreate = {
      title: noteFormData.value.title,
      content: noteFormData.value.content || null
    }

    if (editingNote.value) {
      // 编辑笔记
      await noteApi.updateNote(groupStore.currentGroupId, editingNote.value.id, data)
      message.success('笔记已更新')
    } else {
      // 创建笔记
      await noteApi.createNote(groupStore.currentGroupId, data)
      message.success('笔记已创建')
    }

    await loadNotes()
    handleCloseForm()
  } catch (err: any) {
    message.error(err.message || '保存笔记失败')
  } finally {
    submitting.value = false
  }
}

const handleDeleteNote = async (noteId: number) => {
  if (!groupStore.currentGroupId) return

  dialog.warning({
    title: '确认删除',
    content: '确定要删除这条笔记吗？',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await noteApi.deleteNote(groupStore.currentGroupId!, noteId)
        await loadNotes()
        message.success('笔记已删除')
      } catch (err: any) {
        message.error(err.message || '删除笔记失败')
      }
    }
  })
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
</style>
