<template>
  <router-view />
</template>

<script setup lang="ts">
// 根组件，只负责渲染路由视图
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
  background-color: #f5f5f5;
}

/* FullCalendar 全局样式定制 */
:root {
  --fc-button-bg-color: #4CAF50;
  --fc-button-border-color: #4CAF50;
  --fc-button-hover-bg-color: #45a049;
  --fc-button-hover-border-color: #45a049;
  --fc-button-active-bg-color: #388E3C;
  --fc-button-active-border-color: #388E3C;
  --fc-event-bg-color: #4CAF50;
  --fc-event-border-color: #4CAF50;
  --fc-today-bg-color: rgba(76, 175, 80, 0.1);
}

/* FullCalendar 按钮样式优化 */
.fc .fc-button {
  text-transform: none;
  font-weight: 500;
  box-shadow: none;
}

.fc .fc-button:focus {
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3);
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
  color: #4CAF50;
}
</style>

