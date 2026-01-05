<template>
  <div class="event-list-view">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-group">
        <label for="search">搜索：</label>
        <input
          id="search"
          v-model="searchQuery"
          type="text"
          placeholder="搜索事件标题..."
          class="filter-input"
        />
      </div>
      <div class="filter-group">
        <label for="sortBy">排序：</label>
        <select id="sortBy" v-model="sortBy" class="filter-select">
          <option value="start_time_asc">开始时间 ↑</option>
          <option value="start_time_desc">开始时间 ↓</option>
          <option value="created_at_desc">创建时间（最新）</option>
        </select>
      </div>
      <div class="stats">
        共 {{ filteredEvents.length }} 个事件
      </div>
    </div>

    <!-- 事件列表 -->
    <div v-if="filteredEvents.length === 0" class="empty-state">
      <p>没有找到匹配的事件</p>
    </div>

    <div v-else class="events-table">
      <div class="table-header">
        <div class="col-color"></div>
        <div class="col-title">标题</div>
        <div class="col-time">时间</div>
        <div class="col-location">地点</div>
        <div class="col-actions">操作</div>
      </div>

      <div
        v-for="event in filteredEvents"
        :key="event.id"
        class="table-row"
        @click="handleRowClick(event)"
      >
        <div class="col-color">
          <div
            class="color-indicator"
            :style="{ backgroundColor: getUserColor(event.created_by) }"
          ></div>
        </div>
        <div class="col-title">
          <div class="event-title">{{ event.title }}</div>
          <div v-if="event.description" class="event-description">
            {{ event.description }}
          </div>
        </div>
        <div class="col-time">
          <div class="time-info">
            <div>{{ formatDateTime(event.start_time) }}</div>
            <div class="time-separator">→</div>
            <div>{{ formatDateTime(event.end_time) }}</div>
          </div>
          <div v-if="event.all_day" class="badge">全天</div>
        </div>
        <div class="col-location">
          <span v-if="event.location">{{ event.location }}</span>
          <span v-else class="text-muted">-</span>
        </div>
        <div class="col-actions" @click.stop>
          <button
            @click="$emit('edit', event)"
            class="btn-action btn-edit"
            title="编辑"
          >
            编辑
          </button>
          <button
            @click="$emit('delete', event.id)"
            class="btn-action btn-delete"
            title="删除"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Event } from '@/types'
import { getUserColor } from '@/utils/colors'

interface Props {
  events: Event[]
}

interface Emits {
  (e: 'edit', event: Event): void
  (e: 'delete', eventId: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const searchQuery = ref('')
const sortBy = ref<'start_time_asc' | 'start_time_desc' | 'created_at_desc'>('start_time_asc')

// 筛选和排序事件
const filteredEvents = computed(() => {
  let result = [...props.events]

  // 搜索筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(e =>
      e.title.toLowerCase().includes(query) ||
      (e.description && e.description.toLowerCase().includes(query))
    )
  }

  // 排序
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'start_time_asc':
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      case 'start_time_desc':
        return new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      case 'created_at_desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      default:
        return 0
    }
  })

  return result
})

const handleRowClick = (event: Event) => {
  emit('edit', event)
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.event-list-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 6px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 500;
  color: #555;
  white-space: nowrap;
}

.filter-input,
.filter-select {
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.2s;
}

.filter-input {
  min-width: 200px;
}

.filter-input:focus,
.filter-select:focus {
  border-color: #4CAF50;
}

.stats {
  margin-left: auto;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.events-table {
  display: flex;
  flex-direction: column;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 20px 2fr 2fr 1fr 140px;
  gap: 16px;
  align-items: center;
  padding: 12px 16px;
}

.table-header {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 6px 6px 0 0;
  border-bottom: 2px solid #e0e0e0;
}

.table-row {
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.table-row:hover {
  background-color: #f9f9f9;
}

.table-row:last-child {
  border-bottom: none;
}

.color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.event-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.event-description {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #555;
}

.time-separator {
  color: #999;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  margin-top: 4px;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.text-muted {
  color: #999;
}

.col-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-action {
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  color: #2196F3;
  border-color: #2196F3;
}

.btn-edit:hover {
  background-color: #2196F3;
  color: white;
}

.btn-delete {
  color: #f44336;
  border-color: #f44336;
}

.btn-delete:hover {
  background-color: #f44336;
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 20px 1fr;
    gap: 8px;
  }

  .col-time,
  .col-location,
  .col-actions {
    display: none;
  }

  .table-row {
    padding: 16px 12px;
  }

  .event-description {
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}
</style>

