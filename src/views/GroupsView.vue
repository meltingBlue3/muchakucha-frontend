<template>
  <AppLayout>
    <div class="groups-view">
      <n-space justify="space-between" align="center" style="margin-bottom: 24px;">
        <n-text tag="h2" style="font-size: 24px; font-weight: 600; margin: 0;">
          群组管理
        </n-text>
        <n-button type="primary" @click="showCreateForm = true">
          创建群组
        </n-button>
      </n-space>

      <!-- 群组列表 -->
      <n-grid :cols="3" :x-gap="16" :y-gap="16" responsive="screen">
        <n-grid-item v-for="group in groupStore.groups" :key="group.id">
          <n-card
            :title="group.name"
            :bordered="true"
            hoverable
            :class="{ 'active-group': group.id === groupStore.currentGroupId }"
          >
            <template #header-extra>
              <n-tag v-if="group.id === groupStore.currentGroupId" type="success" size="small">
                当前群组
              </n-tag>
            </template>
            
            <n-text v-if="group.description" depth="3" style="display: block; margin-bottom: 12px;">
              {{ group.description }}
            </n-text>
            
            <n-text depth="3" style="font-size: 12px;">
              创建于 {{ formatDate(group.created_at) }}
            </n-text>

            <template #action>
              <n-space>
                <n-button
                  v-if="group.id !== groupStore.currentGroupId"
                  size="small"
                  @click="handleSelectGroup(group)"
                >
                  选择
                </n-button>
                <n-button size="small" @click="handleShowMembers(group)">
                  成员
                </n-button>
              </n-space>
            </template>
          </n-card>
        </n-grid-item>
      </n-grid>

      <n-empty
        v-if="groupStore.groups.length === 0"
        description="暂无群组，请创建一个群组开始使用"
        style="margin-top: 60px;"
      />

      <!-- 创建群组模态框 -->
      <n-modal
        v-model:show="showCreateForm"
        preset="card"
        title="创建新群组"
        style="width: 500px;"
        :segmented="{
          content: 'soft',
          footer: 'soft'
        }"
      >
        <n-form
          ref="createFormRef"
          :model="createFormData"
          :rules="createRules"
          label-placement="top"
        >
          <n-form-item path="name" label="群组名称">
            <n-input
              v-model:value="createFormData.name"
              placeholder="请输入群组名称"
            />
          </n-form-item>

          <n-form-item path="description" label="描述（可选）">
            <n-input
              v-model:value="createFormData.description"
              type="textarea"
              :rows="3"
              placeholder="请输入群组描述"
            />
          </n-form-item>
        </n-form>

        <template #footer>
          <n-space justify="end">
            <n-button @click="showCreateForm = false">
              取消
            </n-button>
            <n-button 
              type="primary" 
              :loading="loading"
              :disabled="loading"
              @click="handleCreateGroup"
            >
              {{ loading ? '创建中...' : '创建' }}
            </n-button>
          </n-space>
        </template>
      </n-modal>

      <!-- 成员管理模态框 -->
      <n-modal
        v-model:show="showMembersModal"
        preset="card"
        :title="`成员管理 - ${selectedGroup?.name}`"
        style="width: 700px;"
        :segmented="{
          content: 'soft',
          footer: 'soft'
        }"
      >
        <!-- 添加成员表单 -->
        <n-space align="center" style="margin-bottom: 16px;">
          <n-input
            v-model:value="addMemberEmail"
            placeholder="输入成员邮箱"
            style="flex: 1;"
          />
          <n-button 
            type="primary" 
            :loading="loadingMembers"
            :disabled="loadingMembers"
            @click="handleAddMember"
          >
            添加
          </n-button>
        </n-space>

        <!-- 成员列表 -->
        <n-list v-if="members.length > 0" bordered>
          <n-list-item v-for="member in members" :key="member.id">
            <n-thing>
              <template #header>
                <n-text strong>{{ member.user_nickname }}</n-text>
              </template>
              <template #description>
                <n-text depth="3">{{ member.user_email }}</n-text>
              </template>
              <template #header-extra>
                <n-tag size="small" type="info">
                  {{ member.role }}
                </n-tag>
              </template>
            </n-thing>
          </n-list-item>
        </n-list>

        <n-empty
          v-else
          description="暂无成员"
          style="padding: 40px 0;"
        />

        <template #footer>
          <n-space justify="end">
            <n-button @click="showMembersModal = false">
              关闭
            </n-button>
          </n-space>
        </template>
      </n-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGroupStore } from '@/stores/group'
import * as groupApi from '@/api/groups'
import type { Group, GroupMemberDetail } from '@/types'
import AppLayout from '@/components/layout/AppLayout.vue'
import { 
  NSpace, 
  NText, 
  NButton, 
  NCard, 
  NGrid, 
  NGridItem, 
  NTag,
  NEmpty,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NList,
  NListItem,
  NThing,
  useMessage,
  type FormInst,
  type FormRules
} from 'naive-ui'

const groupStore = useGroupStore()
const message = useMessage()

const showCreateForm = ref(false)
const createFormRef = ref<FormInst | null>(null)
const createFormData = ref({
  name: '',
  description: ''
})

const createRules: FormRules = {
  name: [
    {
      required: true,
      message: '请输入群组名称',
      trigger: ['blur', 'input']
    }
  ]
}

const showMembersModal = ref(false)
const selectedGroup = ref<Group | null>(null)
const members = ref<GroupMemberDetail[]>([])
const addMemberEmail = ref('')

const loading = ref(false)
const loadingMembers = ref(false)

onMounted(async () => {
  if (groupStore.groups.length === 0) {
    await groupStore.fetchGroups()
  }
})

const handleCreateGroup = async () => {
  try {
    await createFormRef.value?.validate()
  } catch {
    return
  }

  loading.value = true

  try {
    await groupStore.createGroup(createFormData.value)
    message.success('群组创建成功')
    showCreateForm.value = false
    createFormData.value = { name: '', description: '' }
  } catch (err: any) {
    message.error(err.message || '创建群组失败')
  } finally {
    loading.value = false
  }
}

const handleSelectGroup = (group: Group) => {
  groupStore.setCurrentGroup(group)
  message.success(`已切换到群组：${group.name}`)
}

const handleShowMembers = async (group: Group) => {
  selectedGroup.value = group
  showMembersModal.value = true
  loadingMembers.value = true

  try {
    members.value = await groupApi.getGroupMembers(group.id)
  } catch (err: any) {
    message.error(err.message || '获取成员列表失败')
  } finally {
    loadingMembers.value = false
  }
}

const handleAddMember = async () => {
  if (!selectedGroup.value || !addMemberEmail.value.trim()) {
    message.warning('请输入成员邮箱')
    return
  }

  loadingMembers.value = true

  try {
    await groupApi.addMember(selectedGroup.value.id, {
      email: addMemberEmail.value.trim(),
      role: 'member'
    })
    message.success('成员添加成功')
    addMemberEmail.value = ''
    // 重新加载成员列表
    members.value = await groupApi.getGroupMembers(selectedGroup.value.id)
  } catch (err: any) {
    message.error(err.message || '添加成员失败')
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

.active-group :deep(.n-card) {
  border-color: #18a058;
}
</style>
