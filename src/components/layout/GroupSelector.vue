<template>
  <div class="group-selector">
    <n-text class="selector-label">当前群组：</n-text>
    <n-select
      v-model:value="selectedGroupId"
      :options="groupOptions"
      @update:value="handleGroupChange"
      style="min-width: 180px;"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useGroupStore } from '@/stores/group'
import { NSelect, NText } from 'naive-ui'
import type { SelectOption } from 'naive-ui'

const groupStore = useGroupStore()
const selectedGroupId = ref(groupStore.currentGroupId)

// 监听 store 中的当前群组变化
watch(() => groupStore.currentGroupId, (newId) => {
  selectedGroupId.value = newId
})

// 转换为 NSelect 的选项格式
const groupOptions = computed<SelectOption[]>(() => {
  return groupStore.groups.map(group => ({
    label: group.name,
    value: group.id
  }))
})

const handleGroupChange = (value: number) => {
  const group = groupStore.groups.find(g => g.id === value)
  if (group) {
    groupStore.setCurrentGroup(group)
  }
}
</script>

<style scoped>
.group-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selector-label {
  font-size: 14px;
  white-space: nowrap;
}
</style>
