<template>
  <div
    class="photo-card"
    :style="cardStyle"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <img :src="photoSrc" alt="photo" class="photo-image" />
    <div class="photo-title" v-if="title != ''">{{ title }}</div>
    <div v-if="title != ''" class="delete-icon-container" @click.stop="$emit('delete')">
      <img :src="closeIcon" class="delete-icon" />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { ref } from "vue";

import addIcon from "../../../../../assets/home/add.png";
import closeIcon from "../../../../../assets/home/close.png";
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  // 可选传入图片数组，如果不传就用占位图
  photos: {
    type: Array,
    default: () => [
      "/albums/1.jpg",
      "/albums/2.jpg",
      "/albums/3.jpg",
      "/albums/4.jpg",
      "/albums/5.jpg",
      addIcon,
    ],
  },
});

// 根据 index 选择固定封面
const photoSrc = computed(() => {
  return props.photos[props.index % props.photos.length];
});

// 随机倾斜角度 -10 到 10 度
const angle = (Math.random() * 20 - 10).toFixed(2);

const hover = ref(false);
const cardStyle = computed(() => ({
  transform: hover.value ? `rotate(${0}deg) scale(1.1)` : `rotate(${angle}deg)`,
  transition: "transform 0.3s",
}));
</script>

<style scoped>
.photo-card {
  width: 100%;
  height: 100%;
  margin: 10px;
  position: relative;
  cursor: pointer;
  transition: transform 0.3s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  overflow: visible;
  background-color: #fff;
}
.delete-icon-container {
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background-color: rgb(255, 255, 255);

  position: absolute;
  top: -10px;
  right: -10px;
  opacity: 0;
  transition: all 0.2s ease-in-out;

  display: flex;
  justify-content: center;
  align-items: center;
}
.delete-icon {
  width: 16px;
  height: 16px;
  object-fit: cover;
}
.photo-card:hover .delete-icon-container {
  opacity: 1;
}

.photo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-title {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 4px 6px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 14px;
  text-align: center;
}
</style>
