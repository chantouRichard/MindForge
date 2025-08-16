<template>
  <div class="container">
    <ProgressArea v-if="mode === 'progress'" :item="selectedItem"></ProgressArea>
    <MedalArea v-else-if="mode === 'achievement'" :item="selectedItem"></MedalArea>
    <AnnoArea v-else-if="mode === 'imageannotation'" :item="selectedItem"></AnnoArea>
    <div v-else class="intro-container">
    <div style="width: 80%; display: flex; align-items: flex-start">
      <img :src="introdirectionIcon" class="icon" />
    </div>
    这里是你的成就<br>
    拥有自己的成就感是很不错的事情

    <button class="introbutton" @click="ElMessage.info('暂未实现')">确定今日任务</button>
  </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

import introdirectionIcon from "../../../assets/home/introdirection.jpg";

import { useFileStore } from '../../../store/file';
const fileStore = useFileStore();
const mode = computed(() => fileStore.AchievementMode);
const selectedItem = computed(() => fileStore.AchievementSelected);

import ProgressArea from './achievement/ProgressArea.vue';
import MedalArea from './achievement/MedalArea.vue';
import AnnoArea from './achievement/AnnoArea.vue';
import { ElMessage } from 'element-plus';
</script>

<style scoped>
.container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    width: 100%;

    position: relative;
}

.intro-container {
  width: 100%;
  height: 100%;

  margin-top: 10%;
  display: flex;
  flex-direction: column;
  align-items: center;

  font-family: "文悦孙小松春物语体 (须授权)";
  font-size: 32px;
  font-weight: bold;
}

.icon {
  width: 140px;
  height: 120px;
  margin-right: 20px;

  object-fit: cover;
}

.introbutton {
    width: 108px;
    height: 40px;

    background-color: #609EFF;
    color: white;

    border-radius: 8px;

    font-size: 16px;

    padding: 0;

    margin-top: 20px;

    transition: all 0.3s ease-in-out;
}

.introbutton:hover {
    background-color: #005ebc;
    cursor: pointer;

    transform: matrix() scale(1.1);
}
</style>