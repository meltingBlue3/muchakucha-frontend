<template>
  <div class="label-input-container">
    <!-- 已选择的标签 -->
    <div v-if="selectedLabels.length > 0" class="selected-labels">
      <LabelBadge
        v-for="label in selectedLabels"
        :key="label.id"
        :label="label"
        :removable="true"
        @remove="handleRemoveLabel(label.id)"
      />
    </div>

    <!-- 输入框 -->
    <div class="input-wrapper">
      <input
        ref="inputRef"
        v-model="inputValue"
        type="text"
        :placeholder="placeholder"
        class="label-input"
        @input="handleInput"
        @keydown="handleKeydown"
        @blur="handleBlur"
      />
      
      <!-- 下拉提示框 -->
      <Teleport to="body">
        <div
          v-if="showDropdown && dropdownPosition"
          ref="dropdownRef"
          class="label-dropdown"
          :style="{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }"
        >
          <div
            v-for="(label, index) in filteredLabels"
            :key="label.id"
            class="dropdown-item"
            :class="{ active: index === activeIndex }"
            @mousedown.prevent="handleSelectLabel(label)"
            @mouseenter="activeIndex = index"
          >
            <span
              class="label-color-dot"
              :style="{ backgroundColor: label.color }"
            ></span>
            {{ label.name }}
          </div>

          <!-- 创建新标签选项 -->
          <div
            v-if="searchQuery && !exactMatch"
            class="dropdown-item create-new"
            :class="{ active: activeIndex === filteredLabels.length }"
            @mousedown.prevent="handleCreateLabel"
            @mouseenter="activeIndex = filteredLabels.length"
          >
            <span class="create-icon">+</span>
            创建标签 "{{ searchQuery }}"
          </div>

          <div v-if="filteredLabels.length === 0 && !searchQuery" class="dropdown-empty">
            输入 # 开始添加标签
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useGroupStore } from '@/stores/group'
import * as labelApi from '@/api/labels'
import type { Label, LabelBasic } from '@/types'
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
const inputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const inputValue = ref('')
const showDropdown = ref(false)
const allLabels = ref<Label[]>([])
const searchQuery = ref('')
const activeIndex = ref(0)
const dropdownPosition = ref<{ top: number; left: number; width: number } | null>(null)

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
    activeIndex.value = 0
    updateDropdownPosition()
  } else {
    showDropdown.value = false
    searchQuery.value = ''
  }
}

// 处理键盘事件
const handleKeydown = (e: KeyboardEvent) => {
  if (!showDropdown.value) return

  const maxIndex = exactMatch.value ? filteredLabels.value.length : filteredLabels.value.length
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      activeIndex.value = (activeIndex.value + 1) % (maxIndex + 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      activeIndex.value = activeIndex.value === 0 ? maxIndex : activeIndex.value - 1
      break
    case 'Enter':
      e.preventDefault()
      if (activeIndex.value < filteredLabels.value.length) {
        handleSelectLabel(filteredLabels.value[activeIndex.value])
      } else if (searchQuery.value && !exactMatch.value) {
        handleCreateLabel()
      }
      break
    case 'Escape':
      e.preventDefault()
      showDropdown.value = false
      searchQuery.value = ''
      break
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
  if (!inputRef.value) return
  
  const rect = inputRef.value.getBoundingClientRect()
  dropdownPosition.value = {
    top: rect.bottom + window.scrollY + 4,
    left: rect.left + window.scrollX,
    width: rect.width
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

.selected-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.input-wrapper {
  position: relative;
}

.label-input {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.2s;
}

.label-input:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.label-dropdown {
  position: absolute;
  z-index: 9999;
  max-height: 300px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item:hover,
.dropdown-item.active {
  background-color: #f5f5f5;
}

.dropdown-item.create-new {
  color: #4CAF50;
  font-weight: 500;
  border-top: 1px solid #e0e0e0;
}

.label-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.create-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: #4CAF50;
  color: white;
  border-radius: 50%;
  font-size: 16px;
  line-height: 1;
}

.dropdown-empty {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
}
</style>

