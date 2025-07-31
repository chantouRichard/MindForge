<template>
  <div class="pdf-preview">
    <embed :src="pdfSrc" type="application/pdf" style="width: 100%; height: 100%;" />
  </div>
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
    const byteNumbers = new Array(byteCharacters.length).fill().map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    pdfSrc.value = URL.createObjectURL(blob);
  } else {
    console.error("读取失败", result.error);
  }
};



readContent(fileStore.filePath);
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
