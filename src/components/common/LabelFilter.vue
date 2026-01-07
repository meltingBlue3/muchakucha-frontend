<template>
  <div class="label-filter">
    <div class="filter-trigger" @click="toggleDropdown">
      <span class="filter-label">标签筛选</span>
      <span v-if="selectedCount > 0" class="filter-count">{{ selectedCount }}</span>
      <span class="filter-icon" :class="{ open: showDropdown }">▼</span>
    </div>

    <Teleport to="body">
      <div
        v-if="showDropdown && dropdownPosition"
        ref="dropdownRef"
        class="filter-dropdown"
        :style="{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          minWidth: `${dropdownPosition.width}px`
        }"
        @click.stop
      >
        <div class="dropdown-header">
          <span class="dropdown-title">选择标签</span>
          <button
            v-if="selectedCount > 0"
            @click="handleClearAll"
            class="clear-btn"
            type="button"
          >
            清除
          </button>
        </div>

        <div class="dropdown-body">
          <div v-if="labels.length === 0" class="dropdown-empty">
            暂无标签
          </div>

          <label
            v-for="label in labels"
            :key="label.id"
            class="filter-item"
            :class="{ selected: isSelected(label.id) }"
          >
            <input
              type="checkbox"
              :checked="isSelected(label.id)"
              @change="handleToggleLabel(label.id)"
              class="filter-checkbox"
            />
            <span
              class="label-color-dot"
              :style="{ backgroundColor: label.color }"
            ></span>
            <span class="label-name">{{ label.name }}</span>
          </label>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useGroupStore } from '@/stores/group'
import * as labelApi from '@/api/labels'
import type { Label } from '@/types'

interface Props {
  modelValue: number[] // 选中的标签 ID 数组
}

interface Emits {
  (e: 'update:modelValue', value: number[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const groupStore = useGroupStore()

const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const labels = ref<Label[]>([])
const dropdownPosition = ref<{ top: number; left: number; width: number } | null>(null)
const triggerRef = ref<HTMLElement | null>(null)

const selectedCount = computed(() => props.modelValue.length)

const isSelected = (labelId: number) => {
  return props.modelValue.includes(labelId)
}

const loadLabels = async () => {
  if (!groupStore.currentGroupId) return
  
  try {
    labels.value = await labelApi.getLabels(groupStore.currentGroupId)
  } catch (error) {
    console.error('加载标签列表失败:', error)
  }
}

const toggleDropdown = (e: Event) => {
  showDropdown.value = !showDropdown.value
  
  if (showDropdown.value) {
    triggerRef.value = e.target as HTMLElement
    nextTick(() => {
      updateDropdownPosition()
    })
  }
}

const handleToggleLabel = (labelId: number) => {
  const newValue = isSelected(labelId)
    ? props.modelValue.filter(id => id !== labelId)
    : [...props.modelValue, labelId]
  
  emit('update:modelValue', newValue)
}

const handleClearAll = () => {
  emit('update:modelValue', [])
}

const updateDropdownPosition = () => {
  const trigger = document.querySelector('.filter-trigger') as HTMLElement
  if (!trigger) return
  
  const rect = trigger.getBoundingClientRect()
  dropdownPosition.value = {
    top: rect.bottom + window.scrollY + 4,
    left: rect.left + window.scrollX,
    width: rect.width
  }
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  const dropdown = dropdownRef.value
  const trigger = document.querySelector('.filter-trigger')
  
  if (
    showDropdown.value &&
    dropdown &&
    !dropdown.contains(target) &&
    trigger &&
    !trigger.contains(target)
  ) {
    showDropdown.value = false
  }
}

const handleResize = () => {
  if (showDropdown.value) {
    updateDropdownPosition()
  }
}

onMounted(async () => {
  await loadLabels()
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleResize, true)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleResize, true)
})
</script>

<style scoped>
.label-filter {
  position: relative;
}

.filter-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 14px;
  color: #555;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.filter-trigger:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

.filter-label {
  font-weight: 500;
}

.filter-count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background-color: #4CAF50;
  color: white;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.filter-icon {
  margin-left: auto;
  font-size: 10px;
  transition: transform 0.2s;
}

.filter-icon.open {
  transform: rotate(180deg);
}

.filter-dropdown {
  position: absolute;
  z-index: 9999;
  min-width: 250px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f9f9f9;
}

.dropdown-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.clear-btn {
  padding: 4px 12px;
  font-size: 13px;
  color: #f44336;
  background: none;
  border: 1px solid #f44336;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background-color: #f44336;
  color: white;
}

.dropdown-body {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px 0;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.filter-item:hover {
  background-color: #f9f9f9;
}

.filter-item.selected {
  background-color: #e8f5e9;
}

.filter-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.label-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.label-name {
  flex: 1;
  color: #333;
}

.dropdown-empty {
  padding: 30px 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
}
</style>

