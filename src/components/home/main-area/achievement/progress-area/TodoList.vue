<template>
  <div class="todo-list">
    <div v-for="item in todos" :key="item.id" class="todo-item">
      <label class="todo-label">
        <input
          type="checkbox"
          class="todo-checkbox"
          :checked="item.completed"
          @change="onToggle(item)"
        />
        <span class="todo-text" :class="{ completed: item.completed }">
          {{ item.title }}
          <span v-if="item.dueDate" class="due-date"
            >(due: {{ formatDate(item.dueDate) }})</span
          >
        </span>
      </label>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  progressId: {
    type: Number,
    required: true,
  },
  todos: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["toggle"]);

function onToggle(item) {
  emit('toggle', { id: item.id, progressId: props.progressId, completed: item.completed });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  return date.toISOString().split("T")[0];
}
</script>

<style scoped>
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(8px);

  height: 200px;
  overflow-y: auto;

  position: absolute;
  top: 32px;
  left: 0;

  width: 100%;
  height: 80%;
}

.todo-item {
  padding: 6px 10px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.todo-item:hover {
  background: rgba(128, 0, 128, 0.08);
}

.todo-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-family: "Courier New", monospace;
  font-size: 14px;
}

.todo-checkbox {
  accent-color: #9b5de5; /* 紫色调 */
  transform: scale(1.2);
}

.todo-text {
  white-space: pre-wrap;
}

.todo-text.completed {
  text-decoration: line-through;
  color: rgba(255, 255, 255, 0.5);
}

.due-date {
  color: #a78bfa;
  font-size: 12px;
  margin-left: 4px;
}
</style>
