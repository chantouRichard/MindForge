<template>
  <iframe
    class="pdf-preview"
    ref="pdfIframe"
    :src="`/pdfjs/web/viewer.html?file=${encodeURIComponent(pdfSrc)}`"
    frameborder="0"
  ></iframe>
</template>

<script setup>
import PdfEmbed from "vue-pdf-embed";
import { ref, watch, defineProps } from "vue";
import { useFileStore } from "../../store/file";
const fileStore = useFileStore();

const pdfSrc = ref(""); // 可换成 Blob URL 或 base64

const props = defineProps({
  path: String,
});
watch(
  () => props.path,
  () => {
    console.log("文件路径变化了");
    readContent(props.path);
  }
);

const readContent = async (path) => {
  const result = await window.electronAPI.readFileContent(path);
  if (result.success) {
    const byteCharacters = atob(result.base64);
    const byteNumbers = new Array(byteCharacters.length)
      .fill()
      .map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    pdfSrc.value = URL.createObjectURL(blob);
  } else {
    console.error("读取失败", result.error);
  }
};
readContent(fileStore.filePath);

import { onMounted, onBeforeUnmount } from "vue";

onMounted(() => {
  window.addEventListener("message", getPDFOutline);
});

onBeforeUnmount(() => {
  window.removeEventListener("message", getPDFOutline);
});
const pdfIframe = ref(null);
function messageHandler(event) {
  // if (event.origin !== window.location.origin) return;
  // const data = event.data;
  // if (data?.type === "pdfjs-ai-assist") {
  //   console.log("收到文本:", data.text);
  //   // 调用 AI 相关处理函数
  // }
  const iframeWindow = pdfIframe.value.contentWindow;
  const eventBus = iframeWindow.PDFViewerApplication.eventBus;
  const findController = iframeWindow.PDFViewerApplication.findController;

  eventBus.dispatch("find", {
    source: findController,
    type: "",
    query: "摘 要",
    caseSensitive: false,
    entireWord: false,
    highlightAll: true,
    findPrevious: false,
    matchDiacritics: false,
  });
  // 2秒后取消高亮（清空搜索）
  setTimeout(() => {
    eventBus.dispatch("find", {
      source: findController,
      type: "cancel", // 触发取消
      query: "",
      highlightAll: false,
    });
  }, 2000);
}

// PDF大纲显示
const getPDFOutline = () => {
  const iframeWindow = pdfIframe.value.contentWindow;
  iframeWindow.PDFViewerApplication.pdfDocument.getOutline().then(console.log)
}
</script>

<style scoped>
.pdf-preview {
  display: flex;
  flex-direction: column;
  justify-content: center; /* 水平居中 */

  width: 100%;
  height: 100%;

  overflow: hidden;
}
</style>
