/**
 * 颜色工具函数
 * 用于为不同用户分配固定的颜色
 */

// 预设色板：柔和且易区分的颜色
const COLOR_PALETTE = [
  '#4CAF50', // 绿色
  '#2196F3', // 蓝色
  '#FF9800', // 橙色
  '#E91E63', // 粉色
  '#9C27B0', // 紫色
  '#00BCD4', // 青色
  '#FF5722', // 深橙色
  '#795548', // 棕色
  '#607D8B', // 蓝灰色
  '#8BC34A', // 亮绿色
]

/**
 * 根据用户 ID 获取固定颜色
 * 相同的用户 ID 总是返回相同的颜色
 * @param userId 用户 ID
 * @returns 十六进制颜色值
 */
export const getUserColor = (userId: number): string => {
  return COLOR_PALETTE[userId % COLOR_PALETTE.length]
}

/**
 * 获取颜色的浅色版本（用于背景等）
 * @param color 十六进制颜色值
 * @param opacity 透明度 (0-1)
 * @returns rgba 颜色值
 */
export const getLightColor = (color: string, opacity: number = 0.1): string => {
  // 移除 # 号
  const hex = color.replace('#', '')
  
  // 转换为 RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * 获取所有可用的颜色
 * @returns 颜色数组
 */
export const getAllColors = (): string[] => {
  return [...COLOR_PALETTE]
}

