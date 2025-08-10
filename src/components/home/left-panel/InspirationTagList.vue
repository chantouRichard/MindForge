<template>
  <div class="inspiration-container">
    <div class="tag-item" v-for="(item, index) in inspirations" :key="index" @click="handleClick(item)">
      <div style="display: flex; gap: 4px">
        <div class="decorate-bar"></div>
        <img :src="inspireIcon" alt="" style="width: 20px; height: 20px" />
        {{ item.tag }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import inspireIcon from "../../../assets/home/left-panel/inspire.svg";
const inspirations = ref([
  { tag: "灵感1" },
  { tag: "灵感2" },
  { tag: "灵感3" },
  { tag: "灵感4" },
  { tag: "灵感5" },
]);
onMounted(() => {
  getInspirations();
});

import { useRepositoryStore } from "../../../store/repository";
const repositoryStore = useRepositoryStore();
import { useFileStore } from "../../../store/file";
import { ElMessage } from "element-plus";
const fileStore = useFileStore();
const getInspirations = async () => {
  repositoryStore.loadRepositories();

  const inspirationPath = `${repositoryStore.recentRepositories[0].path}\\.mindforge\\灵感库.inspire.json`;

  window.electronAPI.readFileContent(inspirationPath).then((res) => {
    console.log("灵感库加载成功 :", res);
    if (res.success) {
      fileStore.filePath = inspirationPath;
      fileStore.fileContent = JSON.parse(res.content);
      inspirations.value = JSON.parse(res.content).inspirations;
    }
  });
};

watch(fileStore.fileContent, (newVal) => {
  if (newVal.inspirations != inspirations.value) {
    getInspirations();
  }
});

const handleClick = (item) => {
    fileStore.setInspirationContent(item);
}
</script>

<style>
.inspiration-container {
  width: 100%;
  height: 100%;

  overflow-y: auto;
}

.decorate-bar {
  width: 4px;
  height: 48px;
  border-radius: 2px;

  background-color: #b5b8dc;

  transition: all 0.2s ease-in-out;
}

.tag-item {
  width: 90%;
  height: 48px;

  background-color: #f6f6f6;
  border-radius: 4px;

  display: flex;
  justify-content: flex-start;
  align-items: center;

  transition: all 0.2s ease-in-out;

  margin-top: 8px;

  margin-left: auto;
  margin-right: auto;

  padding-left: 4px;
}

.tag-item:hover {
  background-color: #ececec;

  transform: matrix() scale(1.1);
}
.tag-item:hover .decorate-bar {
    width: 8px;
    border-radius: 4px;
  background-color: #4d4f69;
}
</style>
