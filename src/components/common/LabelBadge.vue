<template>
  <n-tag
    :color="{
      color: label.color,
      textColor: getTextColor(label.color)
    }"
    :size="small ? 'small' : 'medium'"
    :closable="removable"
    :round="true"
    @close="$emit('remove')"
    @click="handleClick"
    :style="{ cursor: clickable ? 'pointer' : 'default' }"
  >
    {{ label.name }}
  </n-tag>
</template>

<script setup lang="ts">
import { NTag } from 'naive-ui'
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
