<template>
  <div style="position: relative; height: 100%; width: 100%">
    <div id="map"></div>
    <div class="button-container" @click="exportMindMapToPDF">
      <img src="../../assets/home/output.png" class="output-button" />
    </div>
  </div>
</template>

<script setup>
import { defineProps, watch, ref } from "vue";
import MindElixir from "mind-elixir";
import "mind-elixir/style.css";

// 解密内容
import CryptoJS from "crypto-js";

const SECRET_KEY = "";

const readContent = async (path) => {
  const result = await window.electronAPI.readFileContent(path);
  try {
    // 🔓 解密
    let decrypted = null;
    if(SECRET_KEY != ''){
    decrypted = CryptoJS.AES.decrypt(result.content, SECRET_KEY).toString(
      CryptoJS.enc.Utf8
    );} else {
    decrypted = result.content;
  }

    return JSON.parse(decrypted);
  } catch (e) {
    console.error("解密或解析失败：", e);
    return MindElixir.new("新主题");
  }
};
const content = ref(null);

const props = defineProps({
  path: String,
});
let mind = null;

watch(
  () => props.path,
  async () => {
    const result = await readContent(props.path);
    if (content.value === result) return;

    content.value = result;

    // 初始化 MindElixir
    if (!mind) {
      const options = {
        el: "#map",
        direction: MindElixir.LEFT,
        draggable: true,
        contextMenu: true,
        toolBar: true,
        nodeMenu: true,
        keypress: true,
        locale: "zh_CN",
        overflowHidden: false,
        mainLinkStyle: 2,
        mouseSelectionButton: 0,
        contextMenuOption: {
          focus: true,
          link: true,
          extend: [
            {
              name: "节点编辑",
              onclick: () => {
                alert("这是自定义的右键菜单");
              },
            },
          ],
        },
        before: {
          insertSibling(type, obj) {
            return true;
          },
        },
      };
      mind = new MindElixir(options);
      window.mind = mind;
    }
    const data = MindElixir.new("新标题");
    if (content.value === null) mind.init(data);
    else
      try {
        mind.init(JSON.parse(JSON.stringify(content.value)));
      } catch (e) {
        console.error("解析失败：", content.value,data);
        mind.init(data);
      }
      mind.bus.addListener('operation', (data) => {
  console.log('🧠 operation:', data);
  if(data.name != 'beginEdit')save();
});

  },
  { immediate: true }
);
// 导出图片
async function saveAsImage() {
  const blob = await mind.exportPng();
  if (blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "思维导图.png";
    a.click();
    URL.revokeObjectURL(url);
  } else {
    console.warn("导出失败，Blob 为空");
  }
}
// 导出PDF
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';

function nodeToMarkdown(node, level = 1) {
  const prefix = "#".repeat(level);
  let markdown = `${prefix} ${node.topic}\n\n`;
  if (node.children) {
    for (const child of node.children) {
      markdown += nodeToMarkdown(child, level + 1);
    }
  }
  return markdown;
}

function exportMindMapToPDF(mindInstance) {
  const data = mind.getData(); // 获取思维导图数据结构
  const markdown = nodeToMarkdown(data.nodeData);

  // 转成 HTML（你也可以自己写 renderer 样式）
  const html = marked.parse(markdown);

  html2pdf().from(html).set({
    filename: "思维导图.pdf",
    margin: 0.5,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
  }).save();
}
// 保存文件
const save = async () => {
  const data = mind.getData();
  const json = JSON.stringify(data);

  // 🔐 加密
  let encrypted = null;
  if(SECRET_KEY != ''){
  encrypted = CryptoJS.AES.encrypt(json, SECRET_KEY).toString();
  console.log("加密内容：", encrypted);}else{
    encrypted = json;
  }

  const result = await window.electronAPI.saveFileContent({
    filePath: props.path,
    content: encrypted,
  });

  console.log("保存结果：", result);
};
</script>

<style scoped>
#map {
  height: 100%;
  width: 100%;
}
.button-container {
  width: 32px;
  height: 32px;

  border-radius: 4px;
  position: absolute;
  top: 20px;
  right: 20px;

  display: flex;
  justify-content: center;
  align-items: center;
}
.button-container:hover {
  background-color: #e4e4e4;
}
.output-button {
  width: 24px;
  height: 20px;
  object-fit: cover;
}

/* 美化工具栏按钮 */
.tool-bar button {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 6px 12px;
  margin: 0 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.tool-bar button:hover {
  background-color: #66b1ff;
}

/* 美化右键菜单 */
.context-menu,
.node-menu {
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 14px;
  color: #333;
}
</style>
