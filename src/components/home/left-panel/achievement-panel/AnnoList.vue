<template>
  <div class="anno-list">
    <el-scrollbar height="100vh">
      <div v-for="(album, idx) in albums" :key="album.id" class="album-block">
        <!-- 分类标题 -->
        <div class="album-header" @click="toggleExpand(idx)">
          <span>{{ album.albumTitle }}</span>
          <el-icon>
            <component :is="expandedIndex === idx ? ArrowDown : ArrowRight" />
          </el-icon>
        </div>

        <!-- 瀑布流徽章列表 -->
        <transition albumTitle="fade">
          <div v-show="expandedIndex === idx" class="memory-grid">
            <div
              v-for="memory in album.memories"
              :key="memory.id"
              class="memory-card"
              @click="handleMedalClick(memory)"
            >
              <div class="memory-albumTitle">{{ memory.memoryTitle }}</div>
            </div>
            <div class="memory-card" @click="openMemoryDialog">
          <img :src="addIcon" class="type" />
            </div>
          </div>
        </transition>
      </div>
      <div class="type-container" @click="openAlbumDialog">
          <img :src="addIcon" class="type" />
        </div>
    </el-scrollbar>
  </div>
  <!-- 新增相册弹窗 -->
    <el-dialog
      title="新增相册"
      v-model="albumDialogVisible"
      width="400px"
    >
      <el-form :model="newAlbum">
        <el-form-item label="相册标题">
          <el-input v-model="newAlbum.albumTitle" placeholder="请输入相册标题" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="albumDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addAlbum">确定</el-button>
      </template>
    </el-dialog>
    <!-- 新增记忆弹窗 -->
    <el-dialog
      title="新增记忆"
      v-model="memoryDialogVisible"
      width="500px"
    >
      <el-form :model="newMemory">
        <el-form-item label="记忆标题">
          <el-input v-model="newMemory.memoryTitle" placeholder="请输入记忆标题" />
        </el-form-item>
        <el-form-item label="缩略图路径">
          <el-input v-model="newMemory.thumbnail" placeholder="例如 /photos/tokyo.jpg" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="memoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addMemory">确定</el-button>
      </template>
    </el-dialog>
</template>

<script setup>
import { ref, onMounted } from "vue";
import addIcon from "../../../../assets/home/add.png"

import { useRepositoryStore } from "../../../../store/repository";
const repositoryStore = useRepositoryStore();
const AchievePath = ref("");
onMounted(async () => {
  repositoryStore.loadRepositories();
  AchievePath.value = `${repositoryStore.recentRepositories[0].path}\\.mindforge\\我的影记.achieve`;

  window.electronAPI.readFileContent(AchievePath.value).then(async (res) => {
    if (res.success) {
      albums.value = JSON.parse(res.content).albums || [];
      fileStore.albums = albums.value;
    } else {
      const content = {
        albums: [],
      };
      let result = await window.electronAPI.newAnno(
        AchievePath.value,
        JSON.stringify(content)
      );
    }
  });
});
const albums = ref([
  {
    albumId: 1,
    albumTitle: "旅行日记",
    memories: [
      {
        memoryId: 101,
        memoryTitle: "东京之旅",
        thumbnail: "/photos/tokyo.jpg",
        images: [
          {
            rotation: 0,
            x: 10,
            y: 10,
            width: 200,
            height: 150,
            scaleX: 1,
            scaleY: 1,
            image: null,
            name: "img1",
            draggable: true,
            src: "/Logo2.png",
          },
          {
            rotation: 0,
            x: 250,
            y: 200,
            width: 200,
            height: 150,
            scaleX: 1,
            scaleY: 1,
            image: null,
            name: "img2",
            draggable: true,
            src: "/Logo.png",
          },
        ],
        texts: [
          {
            id: 1,
            name: "text1",
            x: 100,
            y: 100,
            text: "这里是注释文字",
            fontSize: 20,
            fill: "black",
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            draggable: true,
          },
        ],
      },
      {
        memoryId: 102,
        memoryTitle: "巴黎街头",
        thumbnail: "/photos/paris.jpg",
      },
      {
        memoryId: 103,
        memoryTitle: "冰岛极光",
        thumbnail: "/photos/iceland.jpg",
      },
    ],
  },
  {
    albumId: 2,
    albumTitle: "家庭时光",
    memories: [
      {
        memoryId: 201,
        memoryTitle: "生日派对",
        thumbnail: "/photos/birthday.jpg",
      },
      { memoryId: 202, memoryTitle: "烧烤聚会", thumbnail: "/photos/bbq.jpg" },
    ],
  },
]);

const expandedIndex = ref(null);
function toggleExpand(index) {
  expandedIndex.value = expandedIndex.value === index ? null : index;
}

import { useFileStore } from "../../../../store/file";
import { ElMessage } from "element-plus";
const fileStore = useFileStore();
function handleMedalClick(memory) {
  console.log("点击相册：", memory);
  fileStore.setAchievementMode("imageannotation");

  // 找到当前相册
  const album = fileStore.albums[expandedIndex.value];
  if (!album || !Array.isArray(album.memories)) {
    console.warn("未找到对应相册或 memories 不存在");
    return;
  }

  // 在当前相册中找到 memoryId 相同的元素
  const targetMemory = album.memories.find(m => m.memoryId === memory.memoryId);
  if (!targetMemory) {
    console.warn("未找到对应的 memory");
    return;
  }

  fileStore.setAchievementSelected(targetMemory);
}


// 新增相册
const albumDialogVisible = ref(false);
const newAlbum = ref({
  albumId: "",
  albumTitle: "",
  memories: [],
});

function openAlbumDialog() {
  newAlbum.value = {
    albumId: "album-" + Date.now(),
    albumTitle: "",
    memories: [],
  };
  albumDialogVisible.value = true;
}

function addAlbum() {
  if (!newAlbum.value.albumTitle.trim()) {
    ElMessage.warning("相册标题不能为空");
    return;
  }
  console.log("albums: ",albums.value);
  albums.value.push({ ...newAlbum.value });
  fileStore.albums = albums.value;
  albumDialogVisible.value = false;
}

// 新增记忆弹窗
const memoryDialogVisible = ref(false);
const newMemory = ref({});

function openMemoryDialog() {
  newMemory.value = {
    memoryId: Date.now(),
    memoryTitle: "",
    thumbnail: "",
    images: [
      {
        rotation: 0,
        x: 10,
        y: 10,
        width: 200,
        height: 150,
        scaleX: 1,
        scaleY: 1,
        image: null,
        name: "img1",
        draggable: true,
        src: "/Logo2.png",
      },
      {
        rotation: 0,
        x: 250,
        y: 200,
        width: 200,
        height: 150,
        scaleX: 1,
        scaleY: 1,
        image: null,
        name: "img2",
        draggable: true,
        src: "/Logo.png",
      },
    ],
    texts: [
      {
        id: 1,
        name: "text1",
        x: 100,
        y: 100,
        text: "这里是注释文字",
        fontSize: 20,
        fill: "black",
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        draggable: true,
      },
    ],
  };
  memoryDialogVisible.value = true;
}

function addMemory() {
  if (!newMemory.value.memoryTitle.trim()) {
    ElMessage.warning("记忆标题不能为空");
    return;
  }
  const album = albums.value[expandedIndex.value];
  album.memories.push({ ...newMemory.value });
  fileStore.albums = albums.value;
  memoryDialogVisible.value = false;
}
</script>

<style scoped>
.anno-list {
  padding: 12px;
  width: 100%;
}

/* 分类标题 */
.album-block {
  margin-bottom: 20px;
  user-select: none;
}

.album-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-weight: 600;
  font-size: 16px;
  background: linear-gradient(to right, #f8f9fa, #e9ecef);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.25s ease;
}
.album-header:hover {
  background-color: #dee2e6;
}

/* 徽章卡片布局 */
.memory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 12px;
  padding: 10px 6px 0;
}

.memory-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}
.memory-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 徽章图标 */
.memory-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 6px;
}
.memory-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 徽章文字 */
.memory-albumTitle {
  font-size: 13px;
  text-align: center;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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
