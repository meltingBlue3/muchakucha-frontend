<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <router-view />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider } from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'

// 主题配置（使用 Naive UI 默认蓝色主题）
const themeOverrides: GlobalThemeOverrides = {
  common: {
    borderRadius: '4px'
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
}

/* FullCalendar 全局样式定制 */
:root {
  --fc-button-bg-color: #2080f0;
  --fc-button-border-color: #2080f0;
  --fc-button-hover-bg-color: #4098fc;
  --fc-button-hover-border-color: #4098fc;
  --fc-button-active-bg-color: #1060c9;
  --fc-button-active-border-color: #1060c9;
  --fc-event-bg-color: #2080f0;
  --fc-event-border-color: #2080f0;
  --fc-today-bg-color: rgba(32, 128, 240, 0.1);
}

/* FullCalendar 按钮样式优化 */
.fc .fc-button {
  text-transform: none;
  font-weight: 500;
  box-shadow: none;
}

.fc .fc-button:focus {
  box-shadow: 0 0 0 2px rgba(32, 128, 240, 0.3);
}

/* FullCalendar 事件样式 */
.fc-event {
  border-radius: 4px;
  transition: all 0.2s;
}

.fc-event:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* FullCalendar 今日高亮 */
.fc .fc-day-today {
  background-color: var(--fc-today-bg-color);
}

/* FullCalendar 标题样式 */
.fc .fc-toolbar-title {
  font-weight: 600;
  color: #333;
}

/* FullCalendar 链接样式 */
.fc a {
  color: #333;
  text-decoration: none;
}

.fc a:hover {
  color: #2080f0;
}
</style>

