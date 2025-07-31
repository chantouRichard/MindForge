<template>
  <div class="picture-container">
    <img v-if="pictureUrl" :src="pictureUrl" class="picture" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
const props = defineProps({
  path: String, // 传入本地图片绝对路径
});

const pictureUrl = ref("");

const loadImage = async () => {
  if (props.path) {
    const dataUrl = await window.electronAPI.loadLocalImage(props.path);
    pictureUrl.value = dataUrl;
  }
};

onMounted(loadImage);
watch(() => props.path, loadImage);
</script>

<style>
.picture-container {
  height: 80%;
  width: 100%;
  min-width: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.picture {
  width: 90%;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
}
</style>
