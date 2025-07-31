<template>
  <div class="left-panel" :style="{ width: width + 'px' }">
    <div class="panel-content">
      <div class="panel-header">
        <div class="left-panel-button-container">
          <img
            class="left-panel-button"
            src="../../assets/home/right-panel/hide.png"
            style="rotate: 180deg"
          />
        </div>
      </div>

      <div style="display: flex; width: 100%; height: calc(100% - 40px)">
        <div class="left-panel-toolbar"></div>
        <div
          style="
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
          "
        >
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
                :class="{ toggle: directoryStore.isCollapse }"
              />
            </div>
          </div>
          <div style="flex: 1;overflow: auto;" ref="fileTree">
            <div class="file-tree">
              <TreeItem
                v-for="item in treeData"
                :key="item.path"
                :item="item"
                :expanded-paths="expandedPaths"
                @toggle="handleToggle"
                @contextmenu="onRightClick(node, $event)"
                :force-expand-collapse="forceExpandCollapse"
              />
            </div>
          </div>
          <div class="file-tree-bottom">
            <div class="left-panel-button-container" style="position: absolute;right: 8px;" @click="showSettingPage">
            <img src="../../assets/home/left-panel/setting.png" class="left-panel-button"/></div>
          </div>
        </div>
      </div>
    </div>

    <div class="resizer" @mousedown="onMouseDown"></div>
  </div>
  <RightClickMenu
    ref="rightClickMenuRef"
    :menuItems="menuItems"
    :onSelect="handleMenuSelect"
    :targetNode="rightClickedNode"
  />
  <Setting v-if="showSetting" @close="showSetting = false"/>
</template>

<script setup>
import { ref, watch } from "vue";
import TreeItem from "./TreeItem.vue"; // 自定义组件

// 设置界面展示
import Setting from "./Setting.vue";
const showSetting = ref(false);
const showSettingPage = () =>{
  showSetting.value = true;
}



const props = defineProps({
  path: String,
});

const width = ref(300);
const minWidth = 200;
let startX = 0;
let startWidth = 0;

const onMouseDown = (e) => {
  startX = e.clientX;
  startWidth = width.value;
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};
const onMouseMove = (e) => {
  const delta = e.clientX - startX;
  width.value = Math.max(minWidth, startWidth + delta);
};
const onMouseUp = () => {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
};

// 文件树
const treeData = ref([]);

// 右键点击文件夹
const rightClickedNode = ref(null);

import { nextTick } from "vue";
function onRightClick(node, event) {
  event.preventDefault();
  rightClickedNode.value = node; // 设置当前右键选中的节点
  nextTick(() => {
    rightClickMenuRef.value?.showMenu(event);
  });
}

// 排序文件和文件夹
function sortTreeNodes(nodes) {
  nodes.sort((a, b) => {
    if (a.type === b.type) return 0;
    if (a.type === "directory") return -1;
    return 1; // 文件放后面
  });
  nodes.forEach((node) => {
    if (node.children && node.children.length > 0) {
      sortTreeNodes(node.children);
    }
  });
}
// 加载文件树
const loadDirectoryTree = async (path) => {
  if (!path) return;
  const result = await window.electronAPI.readDirectory(path);

  sortTreeNodes(result); // 排序
  // 使用递归函数重建展开状态
  const restoreExpand = (nodes) => {
    for (const node of nodes) {
      if (node.type === "directory" && expandedPaths.value.has(node.path)) {
        node.isOpen = true;
        if (node.children) {
          restoreExpand(node.children);
        }
      }
    }
  };

  restoreExpand(result);
  treeData.value = result;
};

// 记录文件展开情况
const expandedPaths = ref(new Set());

const handleToggle = (path, isOpen) => {
  if (isOpen) {
    expandedPaths.value.add(path);
  } else {
    expandedPaths.value.delete(path);
  }
  directoryStore.setExpandedPaths(expandedPaths.value);
};

import { useDirectoryStore } from "../../store/directory";
loadDirectoryTree(props.path);
const directoryStore = useDirectoryStore();
watch(
  () => props.path,
  (newPath) => {
    loadDirectoryTree(newPath);
    directoryStore.clearDirty(); // 重置状态
    initPathsAndLastFile();
    window.electronAPI.startWatch(newPath);
  }
);
// 初始化加载文件展开情况和最后打开的文件
import { useFileStore } from "../../store/file";
const fileStore = useFileStore();
const initPathsAndLastFile = async () => {
  const pathsArray = await window.electronAPI.getExpandedPaths();
  expandedPaths.value = new Set(pathsArray);
  directoryStore.setExpandedPaths(expandedPaths.value);

  fileStore.filePath = await window.electronAPI.getLastFilePath();
};
watch(
  () => directoryStore.directoryDirty,
  (dirty) => {
    if (dirty && props.path) {
      loadDirectoryTree(props.path);
      directoryStore.clearDirty(); // 重置状态
    }
  },
  { immediate: true }
);

// 右键目录
import RightClickMenu from "./RightClickMenu.vue";
// 引用右键菜单实例
const rightClickMenuRef = ref(null);
const currentRightSelectedItem = ref(null);

function onContextMenu(e) {
  e.preventDefault();
  rightClickMenuRef.value.showMenu(e);
}

const fileTree = ref(null);

import { onMounted, onBeforeUnmount } from "vue";
onMounted(() => {
  fileTree.value.addEventListener("contextmenu", onContextMenu);
});
onBeforeUnmount(() => {
  fileTree.value.removeEventListener("contextmenu", onContextMenu);
});

// 右键菜单项
import fileIcon from "../../assets/home/left-panel/file.png";
import folderIcon from "../../assets/home/left-panel/folder.png";
import deleteIcon from "../../assets/home/left-panel/delete.png";
import renameIcon from "../../assets/home/left-panel/rename.png";
import mindmapIcon from "../../assets/home/left-panel/mindmap.png";

const menuItems = ref([
  { label: "新建文件", icon: fileIcon },
  {label:"新建思维导图",icon:mindmapIcon},
  { label: "新建文件夹", icon: folderIcon },
  { label: "重命名", icon: renameIcon },
  { label: "删除", icon: deleteIcon },
]);

function handleMenuSelect(item) {
  switch (item.label) {
    case "新建文件": {
      let path = fileStore.currentRightSelectedItem.path;

      window.electronAPI
        .createFile({ parentPath: path, filename: "新建文件.md" })
        .then((res) => {
          if (res.success) {
            loadDirectoryTree(props.path);
          } else {
            console.error("创建失败:", res.error);
          }
        });
      break;
    }
    case "新建思维导图": {
      let path = fileStore.currentRightSelectedItem.path;

      window.electronAPI
        .createMindMap({ parentPath: path, filename: "新建思维导图.mindmap" })
        .then((res) => {
          if (res.success) {
            loadDirectoryTree(props.path);
          } else {
            console.error("创建失败:", res.error);
          }
        });
      break;
    }
    case "新建文件夹": {
      let path = fileStore.currentRightSelectedItem?.path;
      if (path == null) {
        path = props.path; // 如果没有选中项，则在当前目录下创建
      }
      window.electronAPI
        .createFolder({ basePath: path, folderName: "新建文件夹" })
        .then((res) => {
          if (res.success) {
            loadDirectoryTree(props.path);
          } else {
            console.error("创建失败:", res);
          }
        });
      break;
    }
    case "重命名": {
      fileStore.setRenamingItem(fileStore.currentRightSelectedItem);
      break;
    }
    case "删除": {
      let path = fileStore.currentRightSelectedItem.path;
      window.electronAPI.deleteFile(path).then((res) => {
        if (res.success) {
          loadDirectoryTree(props.path);
        } else {
          window.electronAPI.deleteFolder(path).then((res) => {
            if (res.success) {
              loadDirectoryTree(props.path);
            } else {
              console.error("删除失败:", res.error);
            }
          });
        }
      });
      break;
    }
  }
}

// 全部折叠和展开
const forceExpandCollapse = ref({ action: null, trigger: 0 });
const isCollapsed = ref(false);

const expandAndCollapse = () => {
  // if (isCollapsed)
  //   forceExpandCollapse.value = { action: "expand", trigger: Date.now() };
  // else {
  //   forceExpandCollapse.value = { action: "collapse", trigger: Date.now() };
  // }
  // isCollapsed.value = !isCollapsed.value;
  // console.log("isCollapsed: ",isCollapsed.value);
  if (!directoryStore.isCollapse) {
    directoryStore.setCollapse(true);
    directoryStore.setExpand(false);
  } else {
    directoryStore.setCollapse(false);
    directoryStore.setExpand(true);
  }
  console.log("isCollapse: ", directoryStore.isCollapse);
};
</script>

<style scoped>
.left-panel-toolbar {
  width: 42px;
  height: 100%;

  border-right: #ccc solid 1px;
  flex-shrink: 0;
}
.file-tree-toolbar {
  height: 40px;
  width: 100%;

  display: flex;
  justify-content: center;
  align-items: center;

  flex-shrink: 0;
  gap: 4px;
}
.left-panel-button-container {
  display: flex;
  justify-content: center;
  align-items: center;

  width: 30px;
  height: 28px;
  border-radius: 4px;

  -webkit-app-region: no-drag;
}
.left-panel-button {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
}
.left-panel-button-container:hover {
  background-color: #e4e4e4;
}
.left-panel-button.toggle {
  transform: rotate(180deg);
}
.file-tree {
  font-size: 14px;
  padding: 10px;
  overflow-y: auto;

  height: 100%;
}
.file-tree-bottom {
  width: 100%;
  height: 50px;

  background: #f6f6f6;
  flex-shrink: 0;

  border-top: #ccc solid 1px;

  display: flex;
  justify-content: space-around;
  align-items: center;
}
.left-panel {
  display: flex;
  flex-direction: row;
  height: 100vh;
  background-color: #f6f6f6;
  position: relative;
  min-width: 240px;
  border-right: 1px solid #ccc;
}

.panel-header {
  height: 40px;
  width: 100%;

  background-color: #fcfcfc;
  border-bottom: #ccc solid 1px;

  -webkit-app-region: drag;
  flex-shrink: 0;

  display: flex;
  align-items: center;
  padding-left: 10px;
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
  right: 0;
  top: 0;
  bottom: 0;
  transition: background-color 0.2s;
}

/* 鼠标悬浮时边缘变蓝色 */
.resizer:hover {
  background-color: #2196f3; /* 蓝色 */
}
</style>
