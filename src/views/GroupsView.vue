<template>
  <AppLayout>
    <div class="groups-view">
      <div class="page-header">
        <h2 class="page-title">群组管理</h2>
        <button @click="showCreateForm = true" class="btn-primary">
          创建群组
        </button>
      </div>

      <!-- 创建群组表单 -->
      <div v-if="showCreateForm" class="modal-overlay" @click="showCreateForm = false">
        <div class="modal-content" @click.stop>
          <h3 class="modal-title">创建新群组</h3>
          <form @submit.prevent="handleCreateGroup" class="form">
            <div class="form-group">
              <label for="name">群组名称</label>
              <input
                id="name"
                v-model="createFormData.name"
                type="text"
                required
                placeholder="请输入群组名称"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="description">描述（可选）</label>
              <textarea
                id="description"
                v-model="createFormData.description"
                rows="3"
                placeholder="请输入群组描述"
                class="form-input"
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="button" @click="showCreateForm = false" class="btn-secondary">
                取消
              </button>
              <button type="submit" :disabled="loading" class="btn-primary">
                {{ loading ? '创建中...' : '创建' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 群组列表 -->
      <div class="groups-list">
        <div
          v-for="group in groupStore.groups"
          :key="group.id"
          class="group-card"
          :class="{ active: group.id === groupStore.currentGroupId }"
        >
          <div class="group-info">
            <h3 class="group-name">{{ group.name }}</h3>
            <p v-if="group.description" class="group-description">
              {{ group.description }}
            </p>
            <div class="group-meta">
              <span>创建于 {{ formatDate(group.created_at) }}</span>
            </div>
          </div>

          <div class="group-actions">
            <button
              v-if="group.id !== groupStore.currentGroupId"
              @click="handleSelectGroup(group)"
              class="btn-secondary"
            >
              选择
            </button>
            <button @click="handleShowMembers(group)" class="btn-secondary">
              成员
            </button>
          </div>
        </div>

        <div v-if="groupStore.groups.length === 0" class="empty-state">
          <p>暂无群组，请创建一个群组开始使用</p>
        </div>
      </div>

      <!-- 成员管理模态框 -->
      <div v-if="showMembersModal" class="modal-overlay" @click="showMembersModal = false">
        <div class="modal-content large" @click.stop>
          <h3 class="modal-title">成员管理 - {{ selectedGroup?.name }}</h3>

          <!-- 添加成员表单 -->
          <form @submit.prevent="handleAddMember" class="form">
            <div class="form-row">
              <div class="form-group flex-1">
                <input
                  v-model="addMemberEmail"
                  type="email"
                  required
                  placeholder="输入成员邮箱"
                  class="form-input"
                />
              </div>
              <button type="submit" :disabled="loadingMembers" class="btn-primary">
                添加
              </button>
            </div>
          </form>

          <!-- 成员列表 -->
          <div class="members-list">
            <div v-for="member in members" :key="member.id" class="member-item">
              <div class="member-info">
                <div class="member-name">{{ member.user_nickname }}</div>
                <div class="member-email">{{ member.user_email }}</div>
              </div>
              <div class="member-role">
                <span class="role-badge">{{ member.role }}</span>
              </div>
            </div>

            <div v-if="members.length === 0" class="empty-state">
              <p>暂无成员</p>
            </div>
          </div>

          <div class="form-actions">
            <button @click="showMembersModal = false" class="btn-secondary">
              关闭
            </button>
          </div>
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
import * as groupApi from '@/api/groups'
import type { Group, GroupMemberDetail } from '@/types'
import AppLayout from '@/components/layout/AppLayout.vue'

const groupStore = useGroupStore()

const showCreateForm = ref(false)
const createFormData = ref({
  name: '',
  description: ''
})

const showMembersModal = ref(false)
const selectedGroup = ref<Group | null>(null)
const members = ref<GroupMemberDetail[]>([])
const addMemberEmail = ref('')

const loading = ref(false)
const loadingMembers = ref(false)
const error = ref('')

onMounted(async () => {
  if (groupStore.groups.length === 0) {
    await groupStore.fetchGroups()
  }
})

const handleCreateGroup = async () => {
  loading.value = true
  error.value = ''

  try {
    await groupStore.createGroup(createFormData.value)
    showCreateForm.value = false
    createFormData.value = { name: '', description: '' }
  } catch (err: any) {
    error.value = err.message || '创建群组失败'
    setTimeout(() => error.value = '', 3000)
  } finally {
    loading.value = false
  }
}

const handleSelectGroup = (group: Group) => {
  groupStore.setCurrentGroup(group)
}

const handleShowMembers = async (group: Group) => {
  selectedGroup.value = group
  showMembersModal.value = true
  loadingMembers.value = true

  try {
    members.value = await groupApi.getGroupMembers(group.id)
  } catch (err: any) {
    error.value = err.message || '获取成员列表失败'
    setTimeout(() => error.value = '', 3000)
  } finally {
    loadingMembers.value = false
  }
}

const handleAddMember = async () => {
  if (!selectedGroup.value) return

  loadingMembers.value = true
  error.value = ''

  try {
    await groupApi.addMember(selectedGroup.value.id, {
      email: addMemberEmail.value,
      role: 'member'
    })
    addMemberEmail.value = ''
    // 重新加载成员列表
    members.value = await groupApi.getGroupMembers(selectedGroup.value.id)
  } catch (err: any) {
    error.value = err.message || '添加成员失败'
    setTimeout(() => error.value = '', 3000)
  } finally {
    loadingMembers.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.groups-view {
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

.groups-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.group-card {
  padding: 20px;
  background-color: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s;
}

.group-card:hover {
  border-color: #4CAF50;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.group-card.active {
  border-color: #4CAF50;
  background-color: #f1f8f4;
}

.group-info {
  margin-bottom: 16px;
}

.group-name {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.group-description {
  margin: 0 0 8px;
  font-size: 14px;
  color: #666;
}

.group-meta {
  font-size: 12px;
  color: #999;
}

.group-actions {
  display: flex;
  gap: 8px;
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
  max-width: 500px;
  padding: 24px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.modal-content.large {
  max-width: 700px;
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
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.flex-1 {
  flex: 1;
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

.members-list {
  margin: 20px 0;
  max-height: 400px;
  overflow-y: auto;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.member-email {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.role-badge {
  padding: 4px 12px;
  font-size: 12px;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
}

.empty-state {
  padding: 40px;
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

