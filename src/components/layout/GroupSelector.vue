<template>
  <div class="group-selector">
    <label for="group-select">当前群组：</label>
    <select 
      id="group-select" 
      v-model="selectedGroupId" 
      @change="handleGroupChange"
      class="group-select"
    >
      <option v-for="group in groupStore.groups" :key="group.id" :value="group.id">
        {{ group.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useGroupStore } from '@/stores/group'

const groupStore = useGroupStore()
const selectedGroupId = ref(groupStore.currentGroupId)

// 监听 store 中的当前群组变化
watch(() => groupStore.currentGroupId, (newId) => {
  selectedGroupId.value = newId
})

const handleGroupChange = () => {
  const group = groupStore.groups.find(g => g.id === selectedGroupId.value)
  if (group) {
    groupStore.setCurrentGroup(group)
  }
}
</script>

<style scoped>
.group-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

label {
  font-size: 14px;
  color: #333;
}

.group-select {
  padding: 6px 12px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}

.group-select:hover {
  border-color: #4CAF50;
}

.group-select:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}
</style>

