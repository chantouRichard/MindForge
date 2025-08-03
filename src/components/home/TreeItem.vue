<template>
  <div class="tree-item">
    <div class="label-wrapper" @click="toggle">
      <div
        class="label"
        :class="{
          selected: isSelected,
          'right-selected':
            isRightSelected && fileStore.currentRightSelectedItem === item,
        }"
        @contextmenu.prevent="handleRightClick(item)"
      >
        <span
          v-if="item.type === 'directory'"
          class="arrow"
          :class="{ open: isOpen }"
        >
          <img
            style="width: 12px; height: 12px"
            src="../../assets/home/left-panel/fold.png"
          />
        </span>
        <span v-else style="flex-shrink: 0">
          <img
            style="width: 18px; height: 18px; margin-right: 4px;margin-top: 2px;"
            :src="getIconByFilename(item.name)"
          />
        </span>
        <!-- 文件名或重命名输入框 -->
        <div v-if="isRenaming">
          <input
            ref="renameInput"
            v-model="renameText"
            @keydown.enter="confirmRename(item.type)"
            @blur="confirmRename(item.type)"
            class="rename-input"
          />
        </div>
        <div v-else style="text-align: left;">{{ item.name.split(".")[0] }}</div>
      </div>
    </div>

    <transition name="expand">
      <div v-if="isOpen && item.children" class="children">
        <TreeItem
          v-for="child in item.children"
          :key="child.path"
          :item="child"
          :expanded-paths="expandedPaths"
          @toggle="handleChildToggle"
          :force-expand-collapse="forceExpandCollapse"
        /></div
    ></transition>
  </div>
</template>

<script setup>
import { ref, defineEmits } from "vue";
import TreeItem from "./TreeItem.vue";

const props = defineProps({
  item: Object,
  expandedPaths: {
    type: Object,
    default: () => new Set(), // 默认空 Set，保证不会是 undefined
  },
  forceExpandCollapse: {
    type: Object, // { action: 'expand' | 'collapse', trigger: Number }
    required: false,
    default: () => ({ action: null, trigger: 0 }),
  },
});
const emit = defineEmits(["toggle"]);

const isOpen = ref(props.item.isOpen || false);

import { useFileStore } from "../../store/file";
const fileStore = useFileStore();
const toggle = () => {
  if (fileStore.renamingItem !== null) return;

  if (props.item.type === "directory") {
    isOpen.value = !isOpen.value;
    emit("toggle", props.item.path, isOpen.value);
  } else if (props.item.type === "file") {
    fileStore.setfilePath(props.item.path);
  }
};

// 选中之后改变背景颜色
import { computed } from "vue";
const isSelected = computed(() => {
  return props.item.type === "file" && fileStore.filePath === props.item.path;
});

// 监听 props.expandedPaths 变化，保持同步
import { watch } from "vue";
watch(
  () => props.expandedPaths,
  (newVal) => {
    isOpen.value = newVal.has(props.item.path);
  },
  { immediate: true, deep: true }
);
// 监听 forceExpandCollapse 变化，强制展开或折叠
import { useDirectoryStore } from "../../store/directory";
const directoryStore = useDirectoryStore();
watch(
  () => directoryStore.isCollapse,
  (newVal) => {
    if(directoryStore.isCollapse){
      isOpen.value = !newVal;
    }
  }
);
watch(
  () => directoryStore.isExpand,
  (newVal) => {
    if(directoryStore.isExpand){
      isOpen.value = newVal;
    }
  }
)

// 子函数
const handleChildToggle = (path, isOpen) => {
  console.log("fileStore.renamingItem == null", fileStore.renamingItem);
  if (fileStore.renamingItem == null) {
    console.log("等于null");
    emit("toggle", path, isOpen);
  }
};

// 获取文件图标
const iconMap = {
  ".md": "markdown.png",
  ".markdown": "markdown.png",
  ".txt": "text.png",
  ".json": "inspiration.svg",
  ".js": "js.png",
  ".canvas": "canvas.png",
  ".java": "java.png",
  ".vue": "vue.png",
  ".py": "python.png",
  ".png": "picture.png",
  ".mindmap": 'mindmap.png',
  ".pdf": 'pdf.png',
  ".inspire.json": 'inspiration.svg'
  // ...
};

const getIconByFilename = (name) => {
  const entry = Object.entries(iconMap).find(([ext]) => name.endsWith(ext));
  const filename = entry ? entry[1] : "default.png";
  return new URL(`../../assets/home/left-panel/${filename}`, import.meta.url)
    .href;
};

// 右键选中
const isRightSelected = ref(false);
function handleRightClick(item) {
  isRightSelected.value = true;
  fileStore.setCurrentRightSelectedItem(item);
}

// 重命名
const renameInput = ref(null);
const renameText = ref("");

// 当前项是否正在重命名
const isRenaming = computed(() => fileStore.renamingItem === props.item);

// 监听是否进入重命名模式，自动聚焦
import { nextTick } from "vue";
watch(isRenaming, async (newVal) => {
  if (newVal) {
    renameText.value = props.item.name.split(".")[0];
    await nextTick();
    renameInput.value?.focus();
    renameInput.value?.select();
  }
});

// 确认重命名
function confirmRename(type) {
  if (fileStore.renamingItem === null) return;
  if (type === "file") {
    const newName = renameText.value.trim();
    if (newName && newName !== props.item.name.split(".")[0]) {
      const oldPath = props.item.path;
      const newFullName =
        newName + "." + props.item.name.split(".").slice(1).join(".");
      const newPath = oldPath.replace(/[^\\/]+$/, newFullName);

      window.electronAPI
        .renameFile({ oldPath, newName })
        .then((res) => {
          fileStore.renamingItem = null;
          fileStore.setfileTitle(newName);
          fileStore.setfilePath(newPath);
        })
        .catch((err) => {
          console.error("重命名失败", err);
        });
    } else {
      fileStore.renamingItem = null;
    }
  } else {
    const newName = renameText.value.trim();
    if (newName && newName !== props.item.name) {
      const oldPath = props.item.path;
      const newPath = oldPath.replace(/[^\\/]+$/, newName);

      window.electronAPI
        .renameFolder({ oldPath, newName })
        .then((res) => {
          fileStore.renamingItem = null;
          // 如果 filePath 是当前目录或其子项，则替换路径
          if (fileStore.filePath.startsWith(oldPath)) {
            const relativePath = fileStore.filePath.slice(oldPath.length);
            const updatedPath = newPath + relativePath;

            fileStore.setfilePath(updatedPath);
          }
        })
        .catch((err) => {
          console.error("重命名失败", err);
        });
    } else {
      fileStore.renamingItem = null;
    }
  }
}
</script>

<style scoped>
.label.selected {
  background-color: #e4e4e4;
}

.tree-item {
  padding-left: 10px; /* 控制缩进 */
  position: relative;

  margin-top: 2px;
}

.label-wrapper {
  width: 100%;
}

.label {
  width: 100%;
  height: 26px;
  display: flex;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  padding: 0 4px; /* 可调节左右间距 */
  box-sizing: border-box;

  flex: 1; /* 文字部分自动撑满剩余空间 */
    word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
}

.label:hover {
  background-color: #e4e4e4;
}
.label.right-selected {
  outline: 2px solid #666;
}

.children {
  margin-left: 10px;
  border-left: 1px dashed #ccc;
  padding-left: 5px;
}

/* 箭头图标旋转动画 */
.arrow {
  display: inline-block;
  transition: transform 0.2s ease;
  width: 12px;
  height: 12px;

  margin-top: 4px;
}
.arrow.open {
  transform: rotate(90deg); /* 从 ▶ 变为 ▼ */
}

.rename-input {
  width: 100%;
  height: 22px;
  padding: 0 4px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
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
