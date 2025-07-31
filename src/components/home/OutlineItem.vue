<template>
  <li>
    <div class="label" :class="{ selected: isSelected }" @click="toggle">
      <span
        class="arrow"
        :class="{ open: !isOpen }"
        v-if="props.item.children.length"
      >
        <img
            style="width: 12px; height: 12px"
            src="../../assets/home/left-panel/fold.png"
          />
      </span>
      <span v-else style="width: 12px;height: 12px;"></span>
      <span class="text">{{ props.item.text }}</span>
    </div>
    <transition name="expand">
      <ul v-if="!isOpen" class="children">
        <OutlineItem
          v-for="child in props.item.children"
          :key="child.line"
          :item="child"
        />
      </ul>
    </transition>
  </li>
</template>

<script setup>
import { ref, defineProps } from "vue";
const props = defineProps({ item: Object });
const isOpen = ref(props.item.isOpen || false);

import { defineEmits } from "vue";

defineEmits(["toggle"]);
function toggle() {
  isOpen.value = !isOpen.value;
  emit("toggle", props.item.path, isOpen.value);
}
</script>

<style scoped>
.outline-item {
  cursor: pointer;
  padding-left: 4px;
  display: flex;
  align-items: center;
  user-select: none;
}
.caret {
  display: inline-block;
  width: 1em;
  text-align: center;
  margin-right: 4px;
  font-size: 12px;
  color: #666;
}
.text {
  flex: 1;
  font-size: 13px;
}
ul {
  list-style: none;
  margin: 0;
  padding-left: 16px;
  border-left: 1px solid #ccc;
}

.label {
  width: 100%;
  min-height: 26px;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  padding: 0 4px; /* 可调节左右间距 */
  box-sizing: border-box;

  gap: 4px;
}

.label:hover {
  background-color: #e4e4e4;
}

.children {
  margin-left: 10px;
  border-left: 1px solid #ccc;
  padding-left: 5px;
}

/* 箭头图标旋转动画 */
.arrow {
  display: inline-block;
  transition: transform 0.2s ease;
}
.arrow.open {
  transform: rotate(90deg); /* 从 ▶ 变为 ▼ */
}

/* 子文件夹展开动画 */
.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
.expand-enter-active,
.expand-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease;
}
.expand-enter-to,
.expand-leave-from {
  max-height: 1000px; /* 足够大即可 */
  opacity: 1;
  overflow: hidden;
}
</style>
