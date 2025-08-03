<template>
  <div class="home-container">
    <leftPanel :path="repositoryPath" />
    <operation :isHome="true" />

    <div class="main-area">
      <!-- 标签页栏 -->
      <div class="tab-bar" ref="tabBarRef">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-item', { active: tab.id === activeTabId }]"
          @click="activeTabId = tab.id"
        >
          <img :src="getIconByFilename(tab.title)" class="home-tab-button" />
          {{ tab.title.split("\\").pop().split(".")[0] || "新标签页" }}
          <div class="close-btn" @click.stop="closeTab(tab.id)">
            <img class="home-tab-button" src="../assets/home/close.png" />
          </div>
        </div>
        <div class="tab-btn" @click="addTab()">
          <img class="home-tab-button" src="../assets/home/add.png" />
        </div>
      </div>

      <!-- 标签内容区 -->
      <div class="tab-content">
        <keep-alive>
          <component
            v-for="tab in tabs"
            :key="tab.id"
            v-show="tab.id === activeTabId"
            :is="getComponentByExt(tab)"
            :path="tab.id"
          />
        </keep-alive>
      </div>
    </div>

    <rightPanel :path="activeTabId" />
    <FloatingAIChat apiUrl="https://spark-api-open.xf-yun.com/v1/chat/completions" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import leftPanel from "../components/home/leftPanel.vue";
import rightPanel from "../components/home/rightPanel.vue";
import operation from "../components/operation.vue";
import markdownArea from "../components/home/markdownArea.vue";
import pictureArea from "../components/home/pictureArea.vue";
import PDFArea from "../components/home/PDFArea.vue";
import MindMapArea from "../components/home/MindMapArea.vue";
import inspirationArea from "../components/home/main-area/inspirationArea.vue";
import FloatingAIChat from "../components/home/FloatingAIChat.vue";

import { useRepositoryStore } from "../store/repository";
import { useFileStore } from "../store/file";

const repositoryPath = ref("");
const repositoryStore = useRepositoryStore();
const fileStore = useFileStore();

const tabs = ref([]); // 存储打开的标签页 [{id: filePath, title, ext}]
const activeTabId = ref(null);

function getExt(path) {
  return path.split(".").pop().toLowerCase();
}

// 根据文件后缀返回对应组件
function getComponentByExt(tab) {
  switch (tab.ext) {
    case "md": {
      return markdownArea;
    }
    case "png": {
      return pictureArea;
    }
    case "pdf": {
      return PDFArea;
    }
    case "mindmap":
      return MindMapArea;
    default: {
      return inspirationArea;
    }
  }
}

// 添加新标签（这里简单示范可修改）
async function addTab() {
  // 这里可以弹窗让用户选择文件，或者默认打开一个空白文件
  const newFilename = `新建文件.md`;
  const path = fileStore.filePath.split("\\").slice(0, -1).join("\\");

  await window.electronAPI
    .createFile({ parentPath: path, filename: newFilename })
    .then((res) => {
      if (res.success) {
        const newId = res.path;
        fileStore.setfilePath(newId);
        tabs.value.push({
          id: newId,
          title: res.path.split("\\").pop(),
          ext: "md",
        });
        activeTabId.value = newId;
      }
    });
}

// 关闭标签
function closeTab(id) {
  const idx = tabs.value.findIndex((t) => t.id === id);
  if (idx !== -1) {
    tabs.value.splice(idx, 1);
    if (activeTabId.value === id) {
      const nextTab = tabs.value[idx] || tabs.value[idx - 1];
      activeTabId.value = nextTab ? nextTab.id : null;
    }
  }
  // 关闭最后一个标签页之后新建一个
  if (tabs.value.length === 0) {
    addTab();
  }
}

// 监听 fileStore.filePath 变化时，自动打开对应文件（如果未打开）
watch(
  () => fileStore.filePath,
  (newPath) => {
    if (!newPath) return;
    let tab = tabs.value.find((t) => t.id === newPath);
    if (!tab) {
      const ext = getExt(newPath);
      const title = newPath.split("/").pop();
      tabs.value.push({ id: newPath, title, ext });
    }
    activeTabId.value = newPath;
  }
);

const repositoryName = ref("");

// 滚轮直接滚动，而不需要shift+滚轮
const tabBarRef = ref(null);

const onWheel = (e) => {
  if (tabBarRef.value) {
    tabBarRef.value.scrollLeft += e.deltaY;
  }
};
onMounted(() => {
  window.repositoryAPI
    .getRepositories()
    .then((repos) => {
      if (repos.length > 0) {
        repositoryPath.value = repos[0].path;
        repositoryName.value = repos[0].name;

        repositoryStore.recentRepositories = repos;
      }
    })
    .catch((err) => {
      console.error("加载仓库列表失败", err);
    });

  tabBarRef.value?.addEventListener("wheel", onWheel);
});
onBeforeUnmount(() => {
  tabBarRef.value?.removeEventListener("wheel", onWheel);
});

// 根据文件后缀选择图片
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
  ".mindmap": "mindmap.png",
  ".pdf": "pdf.png",
  ".inspire.json": "inspiration.svg"
  // ...
};

const getIconByFilename = (name) => {
  const entry = Object.entries(iconMap).find(([ext]) => name.endsWith(ext));
  const filename = entry ? entry[1] : "default.png";
  return new URL(`../assets/home/left-panel/${filename}`, import.meta.url).href;
};
</script>

<style scoped>
.tab-bar {
  display: flex;
  align-items: center;
  background: #fcfcfc;
  gap: 4px;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;

  height: 40px;

  border-bottom: #ccc 1px solid;

  padding-top: 6px;
  padding-left: 20px;
  padding-right: 20px;
  /* 隐藏滚动条：WebKit 浏览器 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  flex: 0 0 auto;
}
.tab-bar::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.tab-item {
  min-width: 60px;
  font-size: 14px;
  padding: 4px 4px;
  background: #fcfcfc;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;

  color: rgba(125, 125, 125, 0.792);
  flex-wrap: nowrap; /* 不换行 */
  overflow: hidden; /* 超出隐藏 */

  width: 160px;

  /* 关键新增 */
  white-space: nowrap; /* 禁止文字换行 */
  text-overflow: ellipsis; /* 超出显示省略号 */

  position: relative;
}
.close-btn {
  opacity: 0;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  display: flex;
  justify-content: center;
  align-items: center;

  width: 20px;
  height: 20px;

  margin-left: auto;
  right: 0;

  position: absolute;
}
.tab-item:hover {
  background-color: #e9e9e9;
}
.tab-item:hover .close-btn {
  opacity: 1;
  background: #e9e9e9;
}

.tab-item.active {
  background: white;
  color: black;

  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1); /* 下方柔和阴影 */
  z-index: 2;
  position: relative;
  margin-bottom: -1px; /* 覆盖父容器底部边框 */
  border-bottom: 1px solid white; /* 加一条白色底线遮挡父容器 */

  height: auto;
}
.tab-item.active:hover .close-btn {
  opacity: 1;
  background: white;
}

.tab-btn {
  flex: 0 0 auto;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  display: flex;
  justify-content: center;
  align-items: center;

  width: 20px;
  height: 20px;

  margin-left: 2px;
}
.close-btn:hover {
  background-color: #e9e9e9;
}
.tab-btn:hover {
  background-color: #e9e9e9;
}
.home-tab-button {
  width: 16px;
  height: 16px;
  object-fit: cover;
  margin-left: 4px;
  margin-right: 4px;
}
.tab-content {
  width: 100%;
  height: 100%;
}
.home-container {
  position: relative;
  user-select: none;

  display: flex;

  height: 100vh;
}

/* 中间Markdown编辑器区域 */
.main-area {
  flex: 1;
  overflow: hidden;
  border-radius: 10px;

  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
}

.main-header {
  height: 40px;
  width: 100%;
  flex-shrink: 0; /* 禁止缩小 */

  background-color: #fcfcfc;

  border-bottom: #ccc solid 1px;

  -webkit-app-region: drag;
  display: flex;
  align-items: center;
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
</style>
