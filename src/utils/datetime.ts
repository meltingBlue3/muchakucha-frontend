/**
 * 将 Date 对象或 datetime-local 字符串转换为本地时间的 ISO 字符串
 * 不进行 UTC 转换，保持本地时间
 * 
 * @param dateInput - Date 对象或 datetime-local 格式的字符串（如 "2024-01-07T14:30"）
 * @returns 本地时间的 ISO 字符串（格式：YYYY-MM-DDTHH:mm:ss）
 * 
 * @example
 * formatLocalTimeToISO(new Date(2024, 0, 7, 14, 30))
 * // 返回: "2024-01-07T14:30:00"
 * 
 * formatLocalTimeToISO("2024-01-07T14:30")
 * // 返回: "2024-01-07T14:30:00"
 */
export function formatLocalTimeToISO(dateInput: Date | string): string {
  let date: Date

  if (typeof dateInput === 'string') {
    // 如果是字符串，直接使用（datetime-local 格式）
    // 注意：不带时区信息的字符串会被解析为本地时间
    date = new Date(dateInput)
  } else {
    date = dateInput
  }

  // 使用本地时间的各个部分组装 ISO 字符串
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  // 返回本地时间的 ISO 格式（不带 Z 后缀）
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

