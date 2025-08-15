<template>
  <div class="sidebar">
    <!-- 一级界面 -->
    <div v-if="viewLevel === 1" class="filter-section">
      <h3>按性质分类</h3>
      <div class="grid">
        <div
          v-for="item in typeFilters"
          :key="item.key"
          class="grid-item"
          @click="goToList('type', item.key)"
        >
          <img :src="item.icon" class="icon" />
          <span>{{ item.label }}</span>
        </div>
      </div>

      <h3>按紧急程度分类</h3>
      <div class="grid">
        <div
          v-for="item in urgencyFilters"
          :key="item.key"
          class="grid-item"
          @click="goToList('urgency', item.key)"
        >
          <img :src="item.icon" class="icon" />
          <span>{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- 二级界面 -->
    <div v-else class="list-section">
      <div class="header">
        <div @click="viewLevel = 1" class="back-btn">
          <img :src="backIcon" class="type" />
        </div>
        <span class="header-title">{{ currentTitle }}</span>
      </div>

      <el-scrollbar height="calc(100vh - 64px)">
        <div
          v-for="item in filteredList"
          :key="item.id"
          class="list-item"
          @click="handleItemClick(item)"
        >
          <div class="list-name">{{ item.title }}</div>
          <img :src="closeIcon" class="list-item-delete" @click.stop="deleteItem(item)"/>
        </div>
        <div class="type-container" @click="openDialog">
          <img :src="addIcon" class="type"/>
        </div>
      </el-scrollbar>
    </div>
  </div>
  <!-- 新增弹窗 -->
  <el-dialog
    v-model="dialogVisible"
    title="新增计划"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="标题">
        <el-input v-model="form.title" placeholder="计划标题" />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="form.type" placeholder="选择类型">
          <el-option label="日常计划" value="daily" />
          <el-option label="长期计划" value="long" />
          <el-option label="临时计划" value="temp" />
        </el-select>
      </el-form-item>
      <el-form-item label="紧急程度">
        <el-select v-model="form.urgency" placeholder="选择紧急程度">
          <el-option label="紧急重要" value="urgent_important" />
          <el-option label="紧急不重要" value="urgent_notimportant" />
          <el-option label="不紧急重要" value="noturgent_important" />
          <el-option label="不紧急不重要" value="noturgent_notimportant" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

import addIcon from "../../../../assets/home/add.png";
import backIcon from "../../../../assets/home/back.png";
import closeIcon from "../../../../assets/home/close.png";
// SVG 路径自己换
import iconDaily from "../../../../assets/home/left-panel/daily.svg";
import iconTemp from "../../../../assets/home/left-panel/temp.svg";
import iconLong from "../../../../assets/home/left-panel/long.svg";
import iconAll from "../../../../assets/home/left-panel/all.svg";
import iconUrgentImp from "../../../../assets/home/left-panel/urgent_important.svg";
import iconUrgentNotImp from "../../../../assets/home/left-panel/urgent_notimportant.svg";
import iconNotUrgentImp from "../../../../assets/home/left-panel/noturgent_important.svg";
import iconNotUrgentNotImp from "../../../../assets/home/left-panel/noturgent_notimportant.svg";

import { useRepositoryStore } from "../../../../store/repository";
const repositoryStore = useRepositoryStore();
const AchievePath = ref("");
onMounted(async () => {
  repositoryStore.loadRepositories();
  AchievePath.value = `${repositoryStore.recentRepositories[0].path}\\.mindforge\\我的成就.achieve`;

  window.electronAPI.readFileContent(AchievePath.value).then(async (res) => {
    if (res.success) {
      fileStore.filePath = AchievePath.value;
      fileStore.fileContent = JSON.parse(res.content);
      allData.value = JSON.parse(res.content).progresses;
      console.log("我的成就加载成功 :", fileStore.fileContent);
    } else {
      const content = {
        progresses: [],
      };
      let result = await window.electronAPI.newProgress(
        AchievePath.value,
        JSON.stringify(content)
      );
    }
  });
});
// 模拟总数据
const allData = ref([
  {
    id: "test1",
    title: "实现跑步计划",
    progresses: [
      {
        id: "test",
        title: "实现跑步计划",
        description: "",
        totalProgress: 0.5,
        milestones: [
          {
            id: "m-001",
            title: "4分半配速4公里",
            targetValue: 100,
            currentValue: 100,
            dueDate: "2025-08-20",
            completed: false,
          },
          {
            id: "m-002",
            title: "4分半配速6公里",
            targetValue: 70,
            currentValue: 40,
            dueDate: "2025-09-01",
            completed: false,
          },
          {
            id: "m-002",
            title: "4分半配速10公里",
            targetValue: 40,
            currentValue: 10,
            dueDate: "2025-09-05",
            completed: false,
          },
        ],
        startDate: "2025-08-01",
        endDate: "2025-09-10",
        status: "in-progress",
        priority: "high",
        tags: ["版本1.0", "发布"],
      },
    ],
    type: "long",
    urgency: "noturgent_notimportant",
  },
  {
    id: "test2",
    title: "实现跑步计划2",
    progresses: [
      {
        id: "test4",
        title: "发布新功能",
        description: "完成产品新版本发布的所有准备工作",
        totalProgress: 0.5,
        milestones: [
          {
            id: "m-001",
            title: "设计完成",
            targetValue: 100,
            currentValue: 100,
            dueDate: "2025-08-20",
            completed: true,
          },
          {
            id: "m-002",
            title: "开发完成",
            targetValue: 70,
            currentValue: 40,
            dueDate: "2025-09-01",
            completed: false,
          },
          {
            id: "m-002",
            title: "开发完成",
            targetValue: 40,
            currentValue: 10,
            dueDate: "2025-09-05",
            completed: false,
          },
        ],
        startDate: "2025-08-01",
        endDate: "2025-09-10",
        status: "in-progress",
        priority: "high",
        tags: ["版本1.0", "发布"],
      },
    ],
    type: "temp",
    urgency: "noturgent_notimportant",
  },
  {
    id: "test3",
    title: "实现跑步计划3",
    progresses: [
      {
        id: "test5",
        title: "发布新功能",
        description: "完成产品新版本发布的所有准备工作",
        totalProgress: 0.5,
        milestones: [
          {
            id: "m-001",
            title: "设计完成",
            targetValue: 100,
            currentValue: 100,
            dueDate: "2025-08-20",
            completed: true,
          },
          {
            id: "m-002",
            title: "开发完成",
            targetValue: 70,
            currentValue: 40,
            dueDate: "2025-09-01",
            completed: false,
          },
          {
            id: "m-002",
            title: "开发完成",
            targetValue: 40,
            currentValue: 10,
            dueDate: "2025-09-05",
            completed: false,
          },
        ],
        startDate: "2025-08-01",
        endDate: "2025-09-10",
        status: "in-progress",
        priority: "high",
        tags: ["版本1.0", "发布"],
      },
    ],
    type: "long",
    urgency: "urgent_notimportant",
  },
  {
    id: "test4",
    title: "实现跑步计4",
    progresses: [
      {
        id: "test6",
        title: "发布新功能",
        description: "完成产品新版本发布的所有准备工作",
        totalProgress: 0.5,
        milestones: [
          {
            id: "m-001",
            title: "设计完成",
            targetValue: 100,
            currentValue: 100,
            dueDate: "2025-08-20",
            completed: true,
          },
          {
            id: "m-002",
            title: "开发完成",
            targetValue: 70,
            currentValue: 40,
            dueDate: "2025-09-01",
            completed: false,
          },
          {
            id: "m-002",
            title: "开发完成",
            targetValue: 40,
            currentValue: 10,
            dueDate: "2025-09-05",
            completed: false,
          },
        ],
        startDate: "2025-08-01",
        endDate: "2025-09-10",
        status: "in-progress",
        priority: "high",
        tags: ["版本1.0", "发布"],
      },
    ],
    type: "long",
    urgency: "noturgent_important",
  },
]);

// 一级按钮配置
const typeFilters = [
  { key: "daily", label: "日常", icon: iconDaily },
  { key: "temp", label: "临时", icon: iconTemp },
  { key: "long", label: "长期", icon: iconLong },
  { key: "all", label: "全部", icon: iconAll },
];

const urgencyFilters = [
  { key: "urgent_important", label: "重要且紧急", icon: iconUrgentImp },
  { key: "urgent_notimportant", label: "紧急不重要", icon: iconUrgentNotImp },
  { key: "noturgent_important", label: "重要不紧急", icon: iconNotUrgentImp },
  {
    key: "noturgent_notimportant",
    label: "不重要不紧急",
    icon: iconNotUrgentNotImp,
  },
];

const viewLevel = ref(1); // 1=筛选界面  2=列表界面
const filterMode = ref(""); // 'type' 或 'urgency'
const filterKey = ref("");

const currentTitle = computed(() => {
  const arr = filterMode.value === "type" ? typeFilters : urgencyFilters;
  const match = arr.find((i) => i.key === filterKey.value);
  return match ? match.label : "";
});

const filteredList = computed(() => {
  if (filterKey.value === "all" && filterMode.value === "type") {
    return allData.value;
  }
  return allData.value.filter(
    (item) => item[filterMode.value] === filterKey.value
  );
});

function goToList(mode, key) {
  filterMode.value = mode;
  filterKey.value = key;
  viewLevel.value = 2;
}

import { useFileStore } from "../../../../store/file";
import { ElMessage } from "element-plus";
const fileStore = useFileStore();
function handleItemClick(item) {
  console.log("点击了：", item);
  fileStore.setAchievementMode("progress");
  fileStore.setAchievementSelected(item);
}

// 新建目录
const dialogVisible = ref(false);
const form = ref({
  id: "",
  title: "",
  progresses: [],
  type: "long",
  urgency: "noturgent_notimportant",
});

function openDialog() {
  // 初始化
  form.value = {
    id: "",
    title: "",
    progresses: [],
    type: "long",
    urgency: "noturgent_notimportant",
  };

  // 根据 currentTitle 自动匹配默认值
  if (currentTitle.value.includes("长期")) {
    form.value.type = "long";
  } else if (currentTitle.value.includes("日常")) {
    form.value.type = "daily";
  } else if (currentTitle.value.includes("临时")) {
    form.value.type = "temp";
  }

  if (currentTitle.value.includes("紧急重要")) {
    form.value.urgency = "urgent_important";
  } else if (currentTitle.value.includes("紧急不重要")) {
    form.value.urgency = "urgent_notimportant";
  } else if (currentTitle.value.includes("不紧急重要")) {
    form.value.urgency = "noturgent_important";
  } else if (currentTitle.value.includes("不紧急不重要")) {
    form.value.urgency = "noturgent_notimportant";
  }

  dialogVisible.value = true;
}

async function deleteItem(item) {
  const preload = {
    path:AchievePath.value,
    outerId:item.id,
    innerId:null
  }
  window.electronAPI.deleteProgress(preload).then((res) => {
    if (res.success) {
      ElMessage.success("删除成功");
      allData.value = allData.value.filter(i => i.id !== item.id);
    } else {
      console.log("删除失败：", res);
      ElMessage.error("删除失败");
    }
  });

}

async function handleSubmit() {
  if (!form.value.title) {
    ElMessage.error("请填写完整信息");
    return;
  }

  // 构造默认数据结构
  const newData = {
    id: "P-" + Date.now(),
    title: form.value.title,
    progresses: [],
    type: form.value.type,
    urgency: form.value.urgency,
  };

  allData.value.push(newData);
  const preload = {
    path: AchievePath.value,
    saveContent: JSON.stringify({ progresses: [newData] }),
  };
  window.electronAPI.saveProgress(preload).then((res) => {
    if (res.success) {
      ElMessage.success("新增成功");
    } else {
      console.log("新增失败：", res);
      ElMessage.error("新增失败");
    }
  });

  dialogVisible.value = false;
}
</script>

<style scoped>
.sidebar {
  width: 100%;
  height: 100%;
  padding: 12px;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.05);
}
.filter-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 24px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;

  justify-content: center;
  align-items: center;

  width: 100%;
}
.grid-item {
  width: 100%;
  max-width: 200px;
  background: #eae9e9;
  border-radius: 8px;
  text-align: center;
  padding: 16px 8px;
  cursor: pointer;
  transition: background 0.2s;

  font-size: 14px;
  font-weight: bold;
}
.grid-item:hover {
  background: #dad9d9;
}
.icon {
  width: 32px;
  height: 32px;
  margin-bottom: 6px;
}
.header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 8px;
}

.back-btn {
  display: flex;
  justify-content: center;
  align-items: center;

  width: 32px;
  height: 32px;
  border-radius: 16px;

  -webkit-app-region: no-drag;
  position: relative;
}

.back-btn:hover {
  background-color: #f0f0f0;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
  background-color: #eae9e9;
}

.list-item:hover {
  background: #dad9d9;
}

.list-item-delete {
  width: 16px;
  height: 16px;
  object-fit: cover;
  color: #6c757d;
  cursor: pointer;

  opacity: 0;
}
.list-item:hover .list-item-delete {
  opacity: 1;
}

.list-name {
  font-size: 14px;
  color: #444;
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
