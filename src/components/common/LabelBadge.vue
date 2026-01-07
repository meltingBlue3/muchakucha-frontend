<template>
  <span
    class="label-badge"
    :style="{
      backgroundColor: label.color,
      color: getTextColor(label.color)
    }"
    :class="{ clickable, small }"
    @click="handleClick"
  >
    {{ label.name }}
    <button
      v-if="removable"
      @click.stop="$emit('remove')"
      class="remove-btn"
      type="button"
      :aria-label="`删除标签 ${label.name}`"
    >
      ×
    </button>
  </span>
</template>

<script setup lang="ts">
import type { LabelBasic } from '@/types'

interface Props {
  label: LabelBasic
  removable?: boolean
  clickable?: boolean
  small?: boolean
}

interface Emits {
  (e: 'remove'): void
  (e: 'click'): void
}

const props = withDefaults(defineProps<Props>(), {
  removable: false,
  clickable: false,
  small: false
})

const emit = defineEmits<Emits>()

const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}

// 根据背景色计算合适的文字颜色
const getTextColor = (bgColor: string): string => {
  // 移除 # 号
  const hex = bgColor.replace('#', '')
  
  // 转换为 RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  // 计算亮度 (使用 YIQ 公式)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  
  // 如果背景较亮，使用深色文字；如果背景较暗，使用浅色文字
  return brightness > 128 ? '#000000' : '#FFFFFF'
}
</script>

<style scoped>
.label-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;
}

.label-badge.small {
  padding: 2px 8px;
  font-size: 12px;
}

.label-badge.clickable {
  cursor: pointer;
}

.label-badge.clickable:hover {
  opacity: 0.85;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  margin-left: 2px;
  background-color: rgba(0, 0, 0, 0.15);
  border: none;
  border-radius: 50%;
  font-size: 16px;
  line-height: 1;
  color: inherit;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-btn:hover {
  background-color: rgba(0, 0, 0, 0.3);
}
</style>

