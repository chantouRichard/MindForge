<template>
  <div class="medal-category-list">
    <el-scrollbar height="100vh">
      <div 
        v-for="(category, idx) in categories" 
        :key="category.id" 
        class="category-block"
      >
        <div class="category-header" @click="toggleExpand(idx)">
          <span>{{ category.name }}</span>
          <el-icon>
            <component :is="expandedIndex === idx ? ArrowDown : ArrowRight" />
          </el-icon>
        </div>

        <transition name="fade">
          <div v-show="expandedIndex === idx" class="wordcloud">
            <span 
              v-for="medal in category.medals" 
              :key="medal.id" 
              class="wordcloud-item"
              :style="{ fontSize: medal.weight + 12 + 'px' }"
              @click="handleMedalClick(medal)"
            >
              {{ medal.name }}
            </span>
          </div>
        </transition>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ArrowRight, ArrowDown } from "@element-plus/icons-vue";

const categories = ref([
  {
    id: 1,
    name: "常用徽章",
    medals: [
      { id: 101, name: "成就先锋", weight: 8, model: "/medal/test.glb" },
      { id: 102, name: "任务达人", weight: 5, model: "/medal/test.glb" },
      { id: 103, name: "学习标兵", weight: 7, model: "/medal/test.glb" }
    ]
  },
  {
    id: 2,
    name: "稀有徽章",
    medals: [
      { id: 201, name: "挑战之王", weight: 10, model: "/medal/test.glb" },
      { id: 202, name: "全能冠军", weight: 6, model: "/medal/test.glb" } ,
      { id: 203, name: "冒险家", weight: 4, model: "/medal/test.glb" }
    ]
  },
  {
    id: 3,
    name: "活动徽章",
    medals: [
      { id: 301, name: "节日快乐", weight: 9, model: "/medal/cup.glb" },
      { id: 302, name: "新年福袋", weight: 7, model: "/medal/test.glb" },
    ]
  }
]);

const expandedIndex = ref(null);

function toggleExpand(index) {
  expandedIndex.value = expandedIndex.value === index ? null : index;
}

import { useFileStore } from "../../../../store/file";
const fileStore = useFileStore();
function handleMedalClick(medal) {
  console.log("点击徽章：", medal);
  fileStore.setAchievementMode("achievement");
  fileStore.setAchievementSelected(medal);
}
</script>

<style scoped>
.medal-category-list {
  padding: 12px;
  width: 100%;
}

.category-block {
  margin-bottom: 16px;
  user-select: none;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  padding: 8px 12px;
  background-color: #f0f3f5;
  border-radius: 6px;
  transition: background-color 0.3s ease;
}
.category-header:hover {
  background-color: #d9e2ec;
}

.wordcloud {
  padding: 10px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  user-select: text;
  border-left: 3px solid #409EFF;
  margin-top: 8px;
}

.wordcloud-item {
  cursor: pointer;
  transition: color 0.2s ease;
  color: #2c3e50;
  user-select: none;
}
.wordcloud-item:hover {
  color: #409EFF;
  text-decoration: underline;
}

/* 动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
