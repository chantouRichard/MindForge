<template>
  <div class="inspiration-area">
    <h2 style="margin-right: auto; margin-left: 20px; display: flex">灵感库</h2>
    <div class="folder-area">
      <div class="folder-list">
        <div
          v-for="(folder, index) in inspirationData"
          :key="index"
          class="folder-item"
          :class="{ active: selectedFolderIndex === index }"
          @click="selectedFolderIndex = index"
        >
          {{ folder.tag }}
        </div>
      </div>
    </div>

    <div class="inspiration-list" v-if="selectedFolder">
      <h3>{{ selectedFolder.tag }}</h3>
      <div class="inspiration-grid">
        <div
          class="inspiration-card"
          v-for="(item, idx) in selectedFolder.inspirations"
          :key="idx"
        >
          <h4>{{ item.title }}</h4>
          <p>{{ item.content }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useFileStore } from "../../../store/file";
import { ElMessage } from "element-plus";

const fileStore = useFileStore();

const inspirationData = ref([]);
const selectedFolderIndex = ref(0);

const selectedFolder = computed(() => {
  return inspirationData.value[selectedFolderIndex.value] || null;
});

onMounted(async () => {
  if (!fileStore.filePath) {
    ElMessage.error("文件路径为空");
    return;
  }

  try {
    const res = await window.electronAPI.readFileContent(fileStore.filePath);
    if (res.success) {
      const parsed = JSON.parse(res.content);
      inspirationData.value = parsed.inspirations || [];
      ElMessage.success("灵感库加载成功");
    } else {
      ElMessage.error("读取灵感库失败");
    }
  } catch (err) {
    ElMessage.error("读取灵感库异常");
    console.error(err);
  }
});
</script>

<style scoped>
.inspiration-area {
  padding: 20px;
  font-family: Arial, sans-serif;

  display: flex;
  flex-direction: column;

  height: 100%;
  overflow-y: auto;
}

.folder-area {
  width: 90%;
  height: 140px;

  overflow-x: auto;
  margin-left: auto;
  margin-right: auto;

  flex: 0 0 auto;
}

.folder-list {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  width: max-content;
}

.folder-item {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  cursor: pointer;

  width: auto;
  height: 100px;
}

.folder-item.active {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.inspiration-list {
  padding: 20px;
}

.inspiration-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* 关键点 */
  gap: 16px;
  justify-items: stretch; /* 保证每列拉伸到可用宽度 */
}

.inspiration-card {
  border: 1px solid #ccc;
  border-radius: 12px;
  padding: 12px;
  background-color: #f9f9f9;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.08);

  user-select: text;

  /* 移除 max-width 限制，让 grid 控制宽度 */
  width: 100%;
  box-sizing: border-box;
}

</style>
