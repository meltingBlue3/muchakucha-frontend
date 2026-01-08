<template>
  <div class="label-input-container">
    <!-- 已选择的标签 -->
    <n-space v-if="selectedLabels.length > 0" size="small">
      <LabelBadge
        v-for="label in selectedLabels"
        :key="label.id"
        :label="label"
        :removable="true"
        @remove="handleRemoveLabel(label.id)"
      />
    </n-space>

    <!-- 输入框 -->
    <n-input
      ref="inputRef"
      v-model:value="inputValue"
      :placeholder="placeholder"
      @input="handleInput"
      @keydown="handleKeydown"
      @blur="handleBlur"
    >
      <template #suffix>
        <n-text depth="3" style="font-size: 12px;">输入 # 添加标签</n-text>
      </template>
    </n-input>
    
    <!-- 下拉提示框 -->
    <n-dropdown
      :show="showDropdown"
      :options="dropdownOptions"
      :render-label="renderDropdownLabel"
      @select="handleSelectFromDropdown"
      placement="bottom-start"
      trigger="manual"
      :x="dropdownPosition?.left"
      :y="dropdownPosition?.top"
    >
      <span></span>
    </n-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, h } from 'vue'
import type { VNodeChild } from 'vue'
import { useGroupStore } from '@/stores/group'
import * as labelApi from '@/api/labels'
import type { Label, LabelBasic } from '@/types'
import { NInput, NSpace, NDropdown, NText } from 'naive-ui'
import type { DropdownOption } from 'naive-ui'
import LabelBadge from './LabelBadge.vue'

interface Props {
  modelValue: number[] // 标签 ID 数组
  placeholder?: string
}

interface Emits {
  (e: 'update:modelValue', value: number[]): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '输入 # 添加标签...'
})

const emit = defineEmits<Emits>()
const groupStore = useGroupStore()

// 预设颜色
const LABEL_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'
]

// 状态
const inputRef = ref<InstanceType<typeof NInput> | null>(null)
const inputValue = ref('')
const showDropdown = ref(false)
const allLabels = ref<Label[]>([])
const searchQuery = ref('')
const dropdownPosition = ref<{ top: number; left: number } | null>(null)
// 存储 key 到 label 的映射
const labelMap = ref<Map<string, Label>>(new Map())

// 已选择的标签
const selectedLabels = computed<LabelBasic[]>(() => {
  return allLabels.value
    .filter(label => props.modelValue.includes(label.id))
    .map(label => ({
      id: label.id,
      name: label.name,
      color: label.color
    }))
})

// 过滤后的标签列表
const filteredLabels = computed(() => {
  if (!searchQuery.value) {
    return allLabels.value.filter(label => !props.modelValue.includes(label.id))
  }

  const query = searchQuery.value.toLowerCase()
  return allLabels.value
    .filter(label => !props.modelValue.includes(label.id))
    .filter(label => label.name.toLowerCase().includes(query))
})

// 是否有完全匹配的标签
const exactMatch = computed(() => {
  if (!searchQuery.value) return false
  const query = searchQuery.value.toLowerCase()
  return allLabels.value.some(label => label.name.toLowerCase() === query)
})

// 下拉选项
const dropdownOptions = computed<DropdownOption[]>(() => {
  // 清空并重建映射
  labelMap.value.clear()
  
  const options: DropdownOption[] = filteredLabels.value.map(label => {
    const key = `label-${label.id}`
    labelMap.value.set(key, label)
    return {
      label: label.name,
      key
    }
  })

  if (searchQuery.value && !exactMatch.value) {
    options.push({
      label: `创建标签 "${searchQuery.value}"`,
      key: 'create-new'
    })
  }

  if (options.length === 0 && !searchQuery.value) {
    return [{
      label: '输入 # 开始添加标签',
      key: 'empty',
      disabled: true
    }]
  }

  return options
})

// 渲染下拉选项标签
const renderDropdownLabel = (option: DropdownOption): VNodeChild => {
  if (option.key === 'create-new') {
    return h('span', { style: 'color: #2080f0; font-weight: 500;' }, option.label as string)
  }
  const label = labelMap.value.get(option.key as string)
  if (label) {
    return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
      h('span', { 
        style: `width: 12px; height: 12px; border-radius: 50%; background-color: ${label.color};` 
      }),
      h('span', label.name)
    ])
  }
  return option.label as VNodeChild
}

// 加载标签列表
const loadLabels = async () => {
  if (!groupStore.currentGroupId) return
  
  try {
    allLabels.value = await labelApi.getLabels(groupStore.currentGroupId)
  } catch (error) {
    console.error('加载标签列表失败:', error)
  }
}

// 处理输入
const handleInput = () => {
  const value = inputValue.value
  const hashIndex = value.lastIndexOf('#')
  
  if (hashIndex !== -1) {
    // 找到 # 符号，提取搜索内容
    searchQuery.value = value.substring(hashIndex + 1).trim()
    showDropdown.value = true
    updateDropdownPosition()
  } else {
    showDropdown.value = false
    searchQuery.value = ''
  }
}

// 处理键盘事件
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && showDropdown.value) {
    e.preventDefault()
    showDropdown.value = false
    searchQuery.value = ''
  }
}

// 处理失焦
const handleBlur = () => {
  // 延迟关闭，确保点击下拉框项目能触发
  setTimeout(() => {
    showDropdown.value = false
    searchQuery.value = ''
  }, 200)
}

// 从下拉框选择
const handleSelectFromDropdown = (key: string) => {
  if (key === 'create-new') {
    handleCreateLabel()
  } else {
    const label = labelMap.value.get(key)
    if (label) {
      handleSelectLabel(label)
    }
  }
}

// 选择标签
const handleSelectLabel = (label: Label) => {
  const newValue = [...props.modelValue, label.id]
  emit('update:modelValue', newValue)
  
  // 清空输入
  inputValue.value = ''
  searchQuery.value = ''
  showDropdown.value = false
  
  // 重新聚焦
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 移除标签
const handleRemoveLabel = (labelId: number) => {
  const newValue = props.modelValue.filter(id => id !== labelId)
  emit('update:modelValue', newValue)
}

// 创建新标签
const handleCreateLabel = async () => {
  if (!groupStore.currentGroupId || !searchQuery.value) return
  
  try {
    // 随机选择颜色
    const randomColor = LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)]
    
    const newLabel = await labelApi.createLabel(groupStore.currentGroupId, {
      name: searchQuery.value,
      color: randomColor
    })
    
    // 添加到标签列表
    allLabels.value.push(newLabel)
    
    // 自动选择新标签
    handleSelectLabel(newLabel)
  } catch (error) {
    console.error('创建标签失败:', error)
  }
}

// 更新下拉框位置
const updateDropdownPosition = () => {
  if (!inputRef.value || !inputRef.value.$el) return
  
  const inputEl = inputRef.value.$el as HTMLElement
  const rect = inputEl.getBoundingClientRect()
  dropdownPosition.value = {
    top: rect.bottom + window.scrollY + 4,
    left: rect.left + window.scrollX
  }
}

// 监听窗口大小变化
const handleResize = () => {
  if (showDropdown.value) {
    updateDropdownPosition()
  }
}

onMounted(async () => {
  await loadLabels()
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleResize, true)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleResize, true)
})

// 监听下拉框显示状态
watch(showDropdown, (show) => {
  if (show) {
    nextTick(() => {
      updateDropdownPosition()
    })
  }
})
</script>

<style scoped>
.label-input-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
