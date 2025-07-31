<template>
  <div style="width: 100%; height: 100%; position: relative">
    <div class="editor-header">
      <div
        style="
          width: 72px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
        "
      >
        <div
          style="
            width: 72px;
            height: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
          "
        >
          <img
            :style="{
              width: '24px',
              height: '24px',
              opacity: canUndo ? 1 : 0.3,
              cursor: canUndo ? 'pointer' : 'not-allowed',
            }"
            src="../../assets/home/back.png"
            @click="handleUndo"
          />
          <img
            :style="{
              width: '24px',
              height: '24px',
              opacity: canRedo ? 1 : 0.3,
              cursor: canRedo ? 'pointer' : 'not-allowed',
            }"
            src="../../assets/home/front.png"
            @click="handleRedo"
          />
        </div>
      </div>
      <div class="editor-header-path">{{ props.path }}</div>
      <div class="editor-header-right">
        <img class="header-right-button" src="../../assets/home/book.png" />
        <img
          class="header-right-button"
          src="../../assets/home/more.png"
          @click.stop="toggleMenu"
        />
      </div>
    </div>
    <div class="scrollable-editor">
      <textarea
        ref="titleInput"
        class="editor-title"
        v-model="title"
        @input="adjustTitleHeight"
        @keydown.enter.prevent="jumpToEditor"
        @blur="handleTitleBlur"
      />

      <div ref="editorContainer" class="markdown-editor" />
      <!-- <InvalidPage v-else/> -->
    </div>
    <RightClickMenu
      ref="rightClickMenuRef"
      :menuItems="menuItems"
      :onSelect="handleMenuSelect"
    />
    <!-- 弹出列表 -->
    <div v-if="showMenu" class="dropdown-menu">
      <div class="menu-item" @click="handleAction('重命名')">重命名</div>
      <div class="menu-item" @click="handleAction('删除')">删除</div>
      <div class="menu-item" @click="handleAction('分享')">分享</div>
      <div class="menu-item" @click="handleAction('导出为PDF')">导出为PDF</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, defineProps } from "vue";
import Vditor from "vditor";
import "vditor/dist/index.css";
// const isVditorReady = ref(false); // 控制Vditor是否已加载的变量

import RightClickMenu from "./RightClickMenu.vue";
import { ElMessage } from "element-plus";

const props = defineProps({
  path: {
    type: String,
    required: true,
  },
});

const title = ref("未命名");
const editorContainer = ref(null);
let vditor = null;
const canUndo = ref(false); // 控制撤销操作的变量
const canRedo = ref(false); // 控制重做操作的变量

import boldIcon from "../../assets/home/right-click/bold.png";
import italicIcon from "../../assets/home/right-click/italic.png";
import codeBlockIcon from "../../assets/home/right-click/codeblock.png";
import clearFormatIcon from "../../assets/home/right-click/clearstyle.png";

const menuItems = [
  { label: "加粗", icon: boldIcon, action: "bold" },
  { label: "斜体", icon: italicIcon, action: "italic" },
  { label: "代码块", icon: codeBlockIcon, action: "codeBlock" },
  { label: "清除格式", icon: clearFormatIcon, action: "clearFormat" },
];

function handleMenuSelect(item) {
  if (!vditor) return;
  const selectedText = vditor.getSelection();

  let replacement = "";

  switch (item.action) {
    case "bold":
      replacement = `**${selectedText || "加粗文本"}**`;
      break;

    case "italic":
      replacement = `*${selectedText || "斜体文本"}*`;
      break;

    case "codeBlock":
      replacement = `\n\`\`\`\n${selectedText || ""}\n\`\`\`\n`;
      break;

    case "clearFormat":
      replacement = selectedText.replace(/[*_`]/g, "");
      break;

    default:
      return;
  }

  // 删除选中文本（如有）
  if (selectedText) {
    vditor.deleteValue(); // 删除当前选区
  }

  // 插入新内容
  vditor.insertValue(replacement);
}

// 引用右键菜单实例
const rightClickMenuRef = ref(null);

function onContextMenu(e) {
  e.preventDefault();
  rightClickMenuRef.value.showMenu(e);
}

// 标题高度控制
const titleInput = ref(null);
const adjustTitleHeight = () => {
  const el = titleInput.value;
  if (el) {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }
};
// 右上角功能组件
const showMenu = ref(false);

// 点击切换菜单
const toggleMenu = () => {
  showMenu.value = !showMenu.value;
  console.log("toggleMenu", showMenu.value);
};

// 处理点击
const handleAction = (action) => {
  console.log(`你点击了：${action}`);
  showMenu.value = false;
  if (action === "导出为PDF") {
    exportToPDF();
  }
};
import jsPDF from "jspdf";
import { marked } from "marked";
import "../../utils/NotoSansSC-Regular-normal.js"; // 确保这里能正确 import 到注册字体的文件
import "../../utils/SimHei-normal.js";
import "../../utils/SimHei-bold.js"
// await import("/fonts/NotoSansSC-Regular-normal.js");
const exportToPDF = () => {
  const markdownText = vditor.getValue();
  const htmlContent = marked(markdownText);

  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait"
  });

  const titleText = title.value || "文档标题";
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 20;

  // 正确设置字体名称为你转换时注册的字体名
  doc.setFont("SimHei", "normal");
  doc.setFontSize(20);
  const titleWidth = doc.getTextWidth(titleText);
  doc.text(titleText, (pageWidth - titleWidth) / 2, y);
  y += 15;

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;
  const paragraphs = tempDiv.querySelectorAll("p, li, h1, h2, h3, pre");

  doc.setFont("SimHei", "normal");
  doc.setFontSize(12);

  paragraphs.forEach((el) => {
  const text = el.innerText.trim();
  if (!text) return;

  // 设置样式：根据标签设定大小和粗细
  let fontSize = 12;
  let isBold = false;

  switch (el.tagName.toLowerCase()) {
    case "h1":
      fontSize = 18;
      isBold = true;
      break;
    case "h2":
      fontSize = 16;
      isBold = true;
      break;
    case "h3":
      fontSize = 14;
      isBold = true;
      break;
    case "li":
      // 加上序号或项目符号
      el.innerText = (el.parentElement.tagName.toLowerCase() === 'ol' ? '• ' : '• ') + el.innerText;
      break;
    case "pre":
      fontSize = 10;
      isBold = false;
      break;
  }

  doc.setFont("SimHei", isBold ? "bold" : "normal");
  doc.setFontSize(fontSize);

  const lines = doc.splitTextToSize(el.innerText, contentWidth);
  if (y + lines.length * (fontSize + 2) > 280) {
    doc.addPage();
    y = 20;
  }

  doc.text(lines, marginLeft, y);
  y += lines.length * (fontSize + 2);
});


  doc.save(`${titleText}.pdf`);
};



// 点击空白处关闭菜单
const handleClickOutside = (event) => {
  const menu = document.querySelector(".dropdown-menu");
  const button = document.querySelector(".header-right-button");
  if (menu && !menu.contains(event.target) && !button.contains(event.target)) {
    showMenu.value = false;
  }
};
onMounted(() => {
  vditor = new Vditor(editorContainer.value, {
    height: "auto",
    width: "100%",
    mode: "ir",
    placeholder: "请输入 Markdown 内容...",
    toolbar: [], // 隐藏工具栏
    cache: { enable: false },
    input: () => {
      updateUndoRedoState();

      const newContent = vditor.getValue();
      updateFileContent(newContent);
    },
    after: () => {
      updateUndoRedoState();
      vditor.setValue(fileStore.fileContent);
      title.value =
        fileStore.filePath.split("\\").pop().split(".")[0] || "未命名";

      // if (fileStore.fileContent) isVditorReady.value = true;
      // console.log(
      //   "isVditorReady",
      //   isVditorReady.value,
      //   "fileStore.fileContent",
      //   fileStore.fileContent
      // );
    },
  });

  // 在编辑区绑定右键菜单
  // if (isVditorReady.value)
  editorContainer.value.addEventListener("contextmenu", onContextMenu);

  adjustTitleHeight();
  window.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  if (vditor) {
    vditor.destroy();
  }
  editorContainer.value.removeEventListener("contextmenu", onContextMenu);
  window.removeEventListener("click", handleClickOutside);
});

// 撤销操作，暂未实现
function updateUndoRedoState() {
  const undo = vditor?.vditor?.undo?.ir;
  if (!undo) return;
  canUndo.value = undo.undoStack.length > 0;
  canRedo.value = undo.redoStack.length > 0;
}

function handleUndo() {
  if (!vditor || !vditor.vditor?.undo?.ir) return;

  updateUndoRedoState();

  ElMessage.error("暂未实现撤销重做功能...");
}

function handleRedo() {
  if (!vditor || !vditor.vditor?.undo?.ir) return;
  updateUndoRedoState();
}

// 跳到正文
import { nextTick } from "vue";
const jumpToEditor = () => {
  nextTick(() => {
    if (titleInput.value instanceof HTMLTextAreaElement) {
      titleInput.value.blur();
    }
    vditor.focus();
  });
};
const handleTitleBlur = () => {
  if (!title.value.trim()) {
    title.value = "未命名";
  }
};
const readFileContent = async (path) => {
  if (path.split(".").pop() != "md") return;

  const result = await window.electronAPI.readFileContent(path);
  fileStore.setfileContent(result.content);
  console.log("读取文件内容完成", result);

  if(vditor)vditor.setValue(result.content);
};
const readFileTitle = async (path) => {
  const result = await window.electronAPI.readFileTitle(path);
  console.log("读取文件标题完成");

  if (result.title != title.value) title.value = result.title;
};
// 监听状态管理里面路径的变化
import { watch } from "vue";
import { useFileStore } from "../../store/file";
const fileStore = useFileStore();
watch(
  () => props.path,
  async (path) => {
    console.log("传入的path：",path)
    if (!path) return;
    await readFileContent(path);
    const result = await readFileTitle(path);
    if (result && result !== title.value) {
      title.value = result;
    }
  },
  { immediate: true }
);

watch(
  () => title.value,
  async (newTitle, oldTitle) => {
    console.log("标题变化了 111");
    if (!newTitle || newTitle === oldTitle) return;

    console.log("标题变化了 222");
    // 拿当前路径做重命名
    const oldPath = fileStore.filePath;
    const result = await window.electronAPI.renameFile({
      oldPath,
      newName: newTitle,
    });

    // 发生了真正的改名，才更新状态
    if (result?.newPath && result.newPath !== oldPath) {
      fileStore.setfilePath(result.newPath);
      fileStore.setfileTitle(newTitle);
    }
  }
);

import { debounce } from "lodash";
import InvalidPage from "./InvalidPage.vue";

const updateFileContent = debounce((newContent) => {
  window.electronAPI.saveFileContent({
    filePath: fileStore.filePath,
    content: newContent,
  });
  fileStore.setfileContent(newContent);
}, 500); // 500 毫秒内只触发一次
</script>

<style scoped>
.editor-header {
  display: flex;
  height: 40px;
  width: 100%;
}
.editor-title {
  font-size: 36px;
  font-weight: bold;
  font-family: unset;
  width: 100%;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  overflow: hidden;
  line-height: 1.2;

  padding: 0; /* 关键：去掉 padding */
  box-sizing: content-box; /* 关键：避免 height 包含 padding */
  min-height: 0 !important;

  text-align: center;
  align-items: center;

  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.editor-header-path {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  font-size: 14px;
  color: #666666;
}

.editor-header-right {
  display: flex;
  align-items: center;

  width: 72px;
  gap: 4px;
  height: 40px;

  justify-content: center;
}

.header-right-button {
  width: 20px;
  height: 20px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  border-radius: 4px;
}
.header-right-button:hover {
  background-color: #ececec;
}
/* 下拉菜单样式 */
.dropdown-menu {
  position: absolute;
  top: 40px;
  right: 10px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 100;

  display: flex;
  flex-direction: column;

  gap: 4px;
  justify-content: center;
  align-items: center;

  padding-top: 6px;
  padding-bottom: 6px;
}

.menu-item {
  width: 90%;
  height: 24px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;

  display: flex;
  justify-content: flex-start;
  align-items: center;

  border-radius: 4px;

  padding-left: 4px;
}

.menu-item:hover {
  background-color: #f2f2f2;
}

.scrollable-editor {
  flex: 1;
  height: calc(100vh - 100px);
  overflow-y: auto; /* 整体可滚动 */
  padding: 8px;
}

.markdown-editor {
  height: auto;
  width: 100%;
  box-sizing: border-box;

  /* 👇 关键：覆盖 Vditor 的 CSS 变量 */
  --textarea-background-color: #ffffff !important;
  --panel-background-color: #ffffff !important;
  --toolbar-background-color: #ffffff !important;

  --panel-shadow: none !important;
  --border-color: #ffffff !important;
  --heading-border-color: #ffffff !important;
}

::v-deep .vditor-content {
  overflow: hidden !important;
  max-height: 100% !important;
}

/* 保证内容区域左对齐且宽度 100% */
::v-deep .vditor {
  text-align: left;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
}

/* 关键区域：强制宽度 100% 并取消 max-width 限制 */
::v-deep .vditor-reset {
  text-align: left;
  max-width: none !important;
  margin: 0 !important;
  box-sizing: border-box;
  width: 100%;
  padding: 10px !important;
}

/* 设置编辑区域背景始终为白色，无论是否聚焦 */
::v-deep .vditor-ir,
::v-deep .vditor-wysiwyg,
::v-deep .vditor-content,
::v-deep .vditor-editor {
  background-color: white !important;
  width: 100% !important;
  box-sizing: border-box;
}

/* 禁用聚焦时的背景色变化 */
::v-deep .vditor-focus .vditor-ir,
::v-deep .vditor-focus .vditor-wysiwyg {
  background-color: white !important;
}

/* 禁用聚焦时所有背景变化 */
::v-deep .vditor,
::v-deep .vditor *:focus,
::v-deep .vditor *:focus-within {
  background-color: white !important;
  outline: none !important;
  box-shadow: none !important;
}

/* 覆盖 ::selection 背景色 */
::v-deep .vditor ::selection {
  background-color: #dde9fe !important; /* 或者和背景色一样 */
}

/* 禁止聚焦状态的色调样式 */
::v-deep .vditor-focus {
  background-color: white;
  box-shadow: none;
}

::v-deep .vditor-ir p {
  min-height: 1.5em;
  display: block;
}
::v-deep .vditor-ir p::before {
  content: "\200b"; /* 零宽空格 Unicode 占位符 */
  display: inline-block;
}
</style>
