<template>
  <div class="right-panel" :style="{ width: width + 'px' }">
    <div class="panel-content">
      <div class="panel-header"></div>
      <div class="file-tree-toolbar">
        <div class="left-panel-button-container">
          <img
            class="left-panel-button"
            src="../../assets/home/left-panel/file.png"
          />
        </div>
        <div class="left-panel-button-container">
          <img
            class="left-panel-button"
            style="width: 22px; height: 22px"
            src="../../assets/home/left-panel/folder.png"
          />
        </div>
        <div class="left-panel-button-container">
          <img
            class="left-panel-button"
            src="../../assets/home/left-panel/sort.png"
          />
        </div>
        <div class="left-panel-button-container">
          <img
            class="left-panel-button"
            src="../../assets/home/left-panel/unshow.png"
          />
        </div>
      </div>
      <ul v-if="needOutline" class="outline-list">
        <OutlineItem
          v-for="item in outlineTree"
          :key="item.line"
          :item="item"
        />
      </ul>
      <div v-else class="panel-img-container">
        <img
          src="../../assets/home/right-panel/notfound.png"
          class="right-panel-img"
        />
        <div class="panel-word">未找到标题行<br />优秀的你并不需要大纲</div>
      </div>
    </div>
    <div class="resizer" @mousedown="onMouseDown"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from "vue";

const minWidth = 200;
const width = ref(300); // 初始宽度

let startX = 0;
let startWidth = 0;

const onMouseDown = (e) => {
  startX = e.clientX;
  startWidth = width.value;

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

const onMouseMove = (e) => {
  const delta = startX - e.clientX;
  width.value = Math.max(minWidth, startWidth + delta);
};

const onMouseUp = () => {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
};

onBeforeUnmount(() => {
  onMouseUp(); // 清理监听器
});

// 大纲视图
import { useFileStore } from "../../store/file";

const fileStore = useFileStore();

import OutlineItem from "./OutlineItem.vue";
// 正则解析 Markdown 中的标题
const needOutline = ref(true);
const outlineTree = ref([]);

import { defineProps } from "vue";
const props = defineProps({ path: String });
watch(
  () => props.path,
  async (path) => {
    if (path.split(".").pop() !== "md") {
      needOutline.value = false;
      outlineTree.value = [];
      return;
    }

    const result = await window.electronAPI.readFileContent(path);
    const newContent = result.content;
    needOutline.value = true;
    const lines = newContent.split("\n");
    const stack = [];
    const tree = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const node = {
          level,
          text: match[2],
          line: i,
          children: [],
          collapsed: false,
        };

        while (stack.length && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        if (stack.length === 0) {
          tree.push(node);
        } else {
          stack[stack.length - 1].children.push(node);
        }

        stack.push(node);
      }
    }
    if (tree.length === 0) {
      needOutline.value = false;
      outlineTree.value = [];
      return;
    }

    outlineTree.value = tree;
  },
  { immediate: true }
);
</script>

<style scoped>
.panel-img-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 40%;
}
.right-panel-img {
  width: 200px;
  height: 200px;
  object-fit: cover;

  border-radius: 16px;
}
.panel-word {
  font-size: 14px;
  color: #ababab;
}
.outline-list {
  list-style: none;
  padding: 0 8px;
  font-size: 14px;
  color: #333;
}

.outline-list li {
  margin: 4px 0;
  cursor: pointer;

  text-align: left;
}
.right-panel {
  display: flex;
  flex-direction: row;
  height: 100vh;
  background-color: #f6f6f6;
  position: relative;
  min-width: 200px;
  border-left: 1px solid #ccc;

  right: 0;
  top: 0;
  bottom: 0;
}

.panel-header {
  height: 40px;
  width: 100%;

  background-color: #fcfcfc;
  border-bottom: #ccc solid 1px;

  -webkit-app-region: drag;
  flex-shrink: 0;
}

.panel-content {
  flex: 1;

  display: flex;
  flex-direction: column;
}

.resizer {
  width: 2px;
  cursor: col-resize;
  background-color: transparent;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  transition: background-color 0.2s;
}

/* 鼠标悬浮时边缘变蓝色 */
.resizer:hover {
  background-color: #2196f3; /* 蓝色 */
}

/* 按钮 */
.file-tree-toolbar {
  height: 40px;
  width: 100%;

  display: flex;
  justify-content: center;
  align-items: center;

  gap: 4px;
}
.left-panel-button-container {
  display: flex;
  justify-content: center;
  align-items: center;

  width: 30px;
  height: 28px;
  border-radius: 4px;
}
.left-panel-button {
  width: 18px;
  height: 18px;
}
.left-panel-button-container:hover {
  background-color: #e4e4e4;
}
</style>
