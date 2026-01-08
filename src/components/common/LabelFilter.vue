<template>
  <n-popselect
    v-model:value="selectedIds"
    :options="labelOptions"
    multiple
    scrollable
    @update:value="handleUpdate"
  >
    <n-button secondary>
      <template #icon>
        <span style="font-size: 14px;">🏷️</span>
      </template>
      标签筛选
      <n-badge
        v-if="selectedCount > 0"
        :value="selectedCount"
        :offset="[10, -2]"
      />
    </n-button>
  </n-popselect>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useGroupStore } from '@/stores/group'
import * as labelApi from '@/api/labels'
import type { Label } from '@/types'
import { NPopselect, NButton, NBadge } from 'naive-ui'
import type { SelectOption } from 'naive-ui'

interface Props {
  modelValue: number[] // 选中的标签 ID 数组
}

interface Emits {
  (e: 'update:modelValue', value: number[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const groupStore = useGroupStore()

const labels = ref<Label[]>([])
const selectedIds = ref<number[]>(props.modelValue)

const selectedCount = computed(() => props.modelValue.length)

// 转换为 NPopselect 的选项格式
const labelOptions = computed<SelectOption[]>(() => {
  return labels.value.map(label => ({
    label: label.name,
    value: label.id
  }))
})

const loadLabels = async () => {
  if (!groupStore.currentGroupId) return
  
  try {
    labels.value = await labelApi.getLabels(groupStore.currentGroupId)
  } catch (error) {
    console.error('加载标签列表失败:', error)
  }
}

const handleUpdate = (value: number[]) => {
  emit('update:modelValue', value)
}

// 监听 props 变化
watch(() => props.modelValue, (newValue) => {
  selectedIds.value = newValue
})

onMounted(async () => {
  await loadLabels()
})
</script>
