<template>
  <div class="container">
    <div class="panel-top">
      <div
        class="type-container"
        v-for="(mode, index) in modes"
        @click="handleModeClick(mode.value)"
        :key="index"
        @mouseenter="mode.showtip = true"
        @mouseleave="mode.showtip = false"
      >
        <img :src="mode.icon" alt="" class="type" />
        <TooltipWrapper :text="mode.name" :show="mode.showtip" />
      </div>
    </div>
    <div class="panel-main" v-if="currentMode === 'progress'">
        <ProgressList/>
    </div>
    <div class="panel-main" v-else-if="currentMode === 'achievement'">
        <MedalList/>
    </div>
    <div class="panel-main" v-else-if="currentMode === 'imageannotation'">
        <AnnoList/>
    </div>
  </div>
</template>

<script setup>
import ProgressList from "./achievement-panel/ProgressList.vue";
import MedalList from "./achievement-panel/MedalList.vue";
import AnnoList from "./achievement-panel/AnnoList.vue";

import TooltipWrapper from "../TooltipWrapper.vue";
import { ref } from "vue";

// 模式选择
import progressIcon from "../../../assets/home/left-panel/progress.svg";
import achievementIcon from "../../../assets/home/left-panel/achievement.svg";
import imageannotationIcon from "../../../assets/home/left-panel/imageannotation.svg";
const modes = ref([
  { name: "进度", icon: progressIcon, value: "progress", showtip: false },
  { name: "成就", icon: achievementIcon, value: "achievement", showtip: false },
  {
    name: "影记",
    icon: imageannotationIcon,
    value: "imageannotation",
    showtip: false,
  },
]);

const currentMode = ref("progress");

const handleModeClick = (mode) => {
  currentMode.value = mode;
};
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
}

.panel-top {
  width: 100%;
  height: 40px;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.type-container {
  display: flex;
  justify-content: center;
  align-items: center;

  width: 40px;
  height: 35px;
  border-radius: 4px;

  -webkit-app-region: no-drag;
  position: relative;
}
.type-container:hover {
  background-color: #e4e4e4;
}

.type {
  width: 24px;
  height: 24px;
  transition: transform 0.2s ease;
}
</style>
