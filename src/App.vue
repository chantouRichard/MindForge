<template>
  <router-view />
</template>

<script setup>
import { onMounted } from "vue";
import { useDirectoryStore } from "./store/directory";
import { useRepositoryStore } from "./store/repository";

const store = useDirectoryStore();
const repositoryStore = useRepositoryStore();
let hasNavigated = false;

onMounted(async () => {
  // document.title = "";

  window.electronAPI.onFsChanged((path) => {
    console.log("渲染进程收到 fs-changed:", path);
    store.markDirty();
  });

  let lastOpenTime = await getLastOpenTime();

  let duringSeconds = Math.floor((Date.now() - lastOpenTime) / 1000);
  let duringMinutes = Math.floor(duringSeconds / 60);
  let duringHours = Math.floor(duringMinutes / 60);
  let duringDays = Math.floor(duringHours / 24);

  if (!hasNavigated && duringDays <= 7) {
    let repository = await window.repositoryAPI.getRepositories();
    let repositoryPath = repository[0].path;
    let repositoryName = repositoryPath.split("\\").pop();

    if (repositoryPath && repositoryName) {
      await repositoryStore.addRepository({
        name: repositoryName,
        path: repositoryPath,
      });

      hasNavigated = true;
      window.electronAPI.goToHome();
    }
  }
});
// window.addEventListener('blur', () => {
//   document.title = "";
// });


const getLastOpenTime = async () => {
  return window.electronAPI.getLastOpenTime();
};
</script>

<style>
@font-face {
  font-family: "Noto Sans SC";
  src: url("/fonts/NotoSansSC-Regular.otf");
}
/* 基础重置 & 全局布局基础 */
*,
*::before,
*::after {
  box-sizing: border-box; /* 统一盒模型，防止padding/margin撑开 */
}

html,
body,
#app {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden; /* 禁止整体滚动条 */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"; /* 通用系统字体 */
    background: transparent !important;
  color: #333; /* 文字基础色 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 防止图片或媒体元素撑破容器 */
img,
video,
canvas,
svg {
  max-width: 100%;
  height: auto;
  display: block;
}

/* 让按钮等交互元素光标变成手型 */
button,
[role="button"],
a {
  cursor: pointer;
  user-select: none;
}

/* 方便后续Flex布局用 */
#app {
  display: flex;
  flex-direction: column;
  /* 你项目如果是单页面全屏，这里撑满全屏 */
  min-height: 100vh;
  min-width: 100vw;
}

/* 禁止页面默认滚动 */
body {
  overscroll-behavior: none;
}

/* 禁止选中（用于按钮、拖拽栏等） */
.no-select {
  user-select: none;
}

/* 拖拽区域（用于Electron无边框窗口） */
.drag-region {
  -webkit-app-region: drag;
}

/* 非拖拽区域（防止拖按钮时拖动窗口） */
.no-drag {
  -webkit-app-region: no-drag;
}
</style>
