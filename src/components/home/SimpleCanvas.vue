<template>
  <iframe
    ref="iframe"
    src="/excalidraw/index.html"
    style="width: 100%; height: 100%; border: none;"
  ></iframe>
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from "vue";
const props = defineProps({
  path: String,
});

const canvasContent = ref("");

const loadCanvas = async () => {
  if (props.path) {
    const data = await window.electronAPI.readFileContent(props.path);
    canvasContent.value = data;
  }
};

const saveCanvas = async () => {
  if (canvasContent.value) {
    await window.electronAPI.saveFileContent({
      filePath: props.path,
      content: canvasContent.value,
    });
  }
};

onMounted(loadCanvas);
watch(() => props.path, loadCanvas);
</script>

<style scoped>
iframe {
  border: none;
}
</style>
