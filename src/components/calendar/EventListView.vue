<template>
  <div class="event-list-view">
    <!-- 筛选栏 -->
    <n-space align="center" justify="space-between" style="margin-bottom: 16px;">
      <n-space align="center">
        <n-input
          v-model:value="searchQuery"
          placeholder="搜索事件标题..."
          clearable
          style="width: 240px;"
        >
          <template #prefix>
            <span>🔍</span>
          </template>
        </n-input>
        
        <n-select
          v-model:value="sortBy"
          :options="sortOptions"
          style="width: 160px;"
        />
      </n-space>
      
      <n-text depth="3">
        共 {{ filteredEvents.length }} 个事件
      </n-text>
    </n-space>

    <!-- 事件表格 -->
    <n-data-table
      :columns="columns"
      :data="filteredEvents"
      :pagination="pagination"
      :row-props="rowProps"
      striped
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import type { Event } from '@/types'
import { getUserColor } from '@/utils/colors'
import { 
  NDataTable, 
  NInput, 
  NSelect, 
  NSpace, 
  NButton,
  NText,
  type DataTableColumns,
  type SelectOption
} from 'naive-ui'
import LabelBadge from '@/components/common/LabelBadge.vue'

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

const sortOptions: SelectOption[] = [
  { label: '开始时间 ↑', value: 'start_time_asc' },
  { label: '开始时间 ↓', value: 'start_time_desc' },
  { label: '创建时间（最新）', value: 'created_at_desc' }
]

const pagination = {
  pageSize: 20
}

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

// 表格列定义
const columns: DataTableColumns<Event> = [
  {
    title: '',
    key: 'color',
    width: 40,
    render: (row) => {
      return h('div', {
        style: {
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: getUserColor(row.created_by),
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
        }
      })
    }
  },
  {
    title: '标题',
    key: 'title',
    minWidth: 200,
    render: (row) => {
      return h('div', [
        h('div', { 
          style: 'font-weight: 500; color: #333; margin-bottom: 4px;' 
        }, row.title),
        row.description ? h('div', { 
          style: 'font-size: 13px; color: #666; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;' 
        }, row.description) : null
      ])
    }
  },
  {
    title: '时间',
    key: 'time',
    width: 280,
    render: (row) => {
      return h('div', [
        h('div', { 
          style: 'display: flex; align-items: center; gap: 8px; font-size: 14px; color: #555;' 
        }, [
          h('span', formatDateTime(row.start_time)),
          h('span', { style: 'color: #999;' }, '→'),
          h('span', formatDateTime(row.end_time))
        ]),
        row.all_day ? h('div', { 
          style: 'display: inline-block; padding: 2px 8px; margin-top: 4px; background-color: #e3f2fd; color: #1976d2; border-radius: 12px; font-size: 12px; font-weight: 500;' 
        }, '全天') : null
      ])
    }
  },
  {
    title: '地点',
    key: 'location',
    width: 150,
    ellipsis: {
      tooltip: true
    },
    render: (row) => {
      return row.location || h('span', { style: 'color: #999;' }, '-')
    }
  },
  {
    title: '标签',
    key: 'labels',
    width: 200,
    render: (row) => {
      if (row.labels && row.labels.length > 0) {
        return h('div', { 
          style: 'display: flex; flex-wrap: wrap; gap: 4px;' 
        }, row.labels.map(label => 
          h(LabelBadge, { 
            label, 
            small: true 
          })
        ))
      }
      return h('span', { style: 'color: #999;' }, '-')
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 140,
    align: 'right',
    render: (row) => {
      return h(NSpace, { size: 'small' }, {
        default: () => [
          h(NButton, {
            size: 'small',
            onClick: (e: Event) => {
              e.stopPropagation()
              emit('edit', row)
            }
          }, { default: () => '编辑' }),
          h(NButton, {
            size: 'small',
            type: 'error',
            secondary: true,
            onClick: (e: Event) => {
              e.stopPropagation()
              emit('delete', row.id)
            }
          }, { default: () => '删除' })
        ]
      })
    }
  }
]

// 行属性
const rowProps = (row: Event) => {
  return {
    style: 'cursor: pointer;',
    onClick: () => {
      emit('edit', row)
    }
  }
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
  width: 100%;
}
</style>
