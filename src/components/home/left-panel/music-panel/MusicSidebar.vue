<template>
  <transition name="fade">
    <div v-show="visible" class="music-sidebar">
      <div
        v-for="(btn, index) in buttons"
        :key="index"
        class="sidebar-btn"
        @click="$emit('button-click', btn.key)"
        @mouseenter="btn.showTip = true"
        @mouseleave="btn.showTip = false"
      >
        <img :src="btn.icon" alt="" class="btn-icon" />
        <span v-if="btn.showTip" class="btn-tooltip">{{ btn.label }}</span>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  visible: { type: Boolean, default: true },
});

import recommendIcon from "../../../../assets/home/left-panel/recommend.svg"
import favoriteIcon from "../../../../assets/home/left-panel/favorite.svg"
import historyIcon from "../../../../assets/home/left-panel/history.svg"
const buttons = ref([
  { key: "recommend", label: "推荐歌曲", icon: recommendIcon, showTip: false },
  { key: "favorite", label: "我的收藏", icon: favoriteIcon, showTip: false },
  { key: "history", label: "播放历史", icon: historyIcon, showTip: false },
]);
</script>

<style scoped>
.music-sidebar {
  position: absolute;
  top: 0px;
  left: 0px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 12px 8px;
  background: transparent;

  z-index: 1000;
}

.sidebar-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.25s ease;
}
.sidebar-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.btn-icon {
  width: 24px;
  height: 24px;
}

.btn-tooltip {
  position: absolute;
  left: 50px;
  top: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;

  z-index: 2000;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
