<template>
  <div class="container">
    <div class="absolute-part">
      <div class="type-container" @click="openDialog">
        <img :src="addIcon" class="type" />
      </div>
    </div>
    <div
      class="progress-area"
      v-for="(progress, index) in progresses"
      :key="index"
    >
      <h3 style="position: absolute; top: 16px; left: 42px">
        {{ progress.title }}
      </h3>
      <img
        v-if="progress.totalProgress >= 1"
        :src="completeIcon"
        alt=""
        class="complete-img"
      />
      <div
        class="progress-bar"
        :ref="(el) => (progressBar[index] = el)"
        @mousedown.prevent="startDrag"
      >
        <div
          class="progress-fill"
          :style="{ width: progress.totalProgress * 100 + '%' }"
        ></div>

        <!-- 里程碑位置固定，基于 targetValue -->
        <template v-for="milestone in progress.milestones" :key="milestone.id">
          <div
            class="milestone"
            :style="{ left: (milestone.targetValue / 100) * 100 + '%' }"
            :title="milestone.title"
          >
            <div
              class="milestone-dot"
              :class="{
                completed: milestone.targetValue <= progress.totalProgress,
              }"
            ></div>
            <div class="milestone-label">{{ milestone.title }}</div>
          </div>
        </template>

        <!-- 进度小三角跟随进度移动 -->
        <div
          class="progress-up-triangle"
          :style="{ left: progress.totalProgress * 100 + '%' }"
        ></div>
        <div
          class="drag-handle"
          :style="{ left: progress.totalProgress * 100 + '%' }"
          @mousedown.prevent="handleDragStart($event, index)"
        ></div>
      </div>
      <div class="progress-text">
        整体进度: {{ Math.round(progress.totalProgress * 100) }}%
      </div>

      <!-- 右上角操作按钮 -->
      <div class="button-container" style="top: 4px;right: 28px;" @click="handleEdit(progress)">
        <img class="button" :src="editIcon"/>
      </div>
      <div class="button-container" style="top: 4px;right: 4px;" @click="handleDelete(progress)">
        <img class="button" :src="closeIcon"/>
      </div>
    </div>
  </div>
  <!-- 弹窗 -->
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="500px"
    :destroy-on-close="true"
  >
    <el-form :model="form" label-width="100px" :inline="false">
      <el-form-item label="标题">
        <el-input v-model="form.title" placeholder="输入任务标题" />
      </el-form-item>

      <el-form-item label="描述">
        <el-input
          type="textarea"
          v-model="form.description"
          rows="3"
          placeholder="输入任务描述"
        />
      </el-form-item>
      <el-form-item label="里程碑">
        <div
          v-for="(ms, idx) in form.milestones"
          :key="ms.id"
          class="milestone-row"
        >
          <el-input
            v-model="ms.title"
            placeholder="里程碑标题"
            style="width: 200px"
          />
          <el-input-number
            v-model="ms.targetValue"
            :min="0"
            :max="100"
            label="目标值"
          />
          <el-date-picker
            v-model="ms.dueDate"
            type="date"
            placeholder="截止日期"
          />
          <el-button type="danger" @click="removeMilestone(idx)"
            >删除</el-button
          >
        </div>
        <el-button type="primary" @click="addMilestone">新增里程碑</el-button>
      </el-form-item>

      <el-form-item label="开始日期">
        <el-date-picker
          v-model="form.startDate"
          type="date"
          placeholder="选择开始日期"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="结束日期">
        <el-date-picker
          v-model="form.endDate"
          type="date"
          placeholder="选择结束日期"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="优先级">
        <el-select v-model="form.priority" placeholder="选择优先级">
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
      </el-form-item>

      <el-form-item label="标签">
        <el-input
          v-model="tagInput"
          placeholder="用逗号分隔标签"
          @keyup.enter="addTags"
        />
        <div class="tag-list">
          <el-tag
            v-for="(tag, index) in form.tags"
            :key="index"
            closable
            @close="removeTag(index)"
            type="success"
            style="margin: 2px"
          >
            {{ tag }}
          </el-tag>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" v-if="submitMode == 'add'" @click="confirmAdd">确定</el-button>
      <el-button type="primary" v-else @click="confirmEdit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import {
  ref,
  reactive,
  onMounted,
  onBeforeUnmount,
  defineProps,
  computed,
} from "vue";

const dialogTitle = computed(() => {
  return submitMode.value === "add" ? "新增任务" : "编辑任务";
});
// 右上角操作按钮函数
const submitMode = ref("add");
function handleEdit(progress) {
  submitMode.value = "edit";
  dialogVisible.value = true;
  form.value = progress;
  tagInput.value = progress.tags.join(", ");
}
async function handleDelete(progress) {
  const preload = {
    path: `${repositoryStore.recentRepositories[0].path}\\.mindforge\\我的成就.achieve`,
    outerId: props.item.id,
    innerId: progress.id,
  }
  window.electronAPI.deleteProgress(preload).then((res)=>{
    if(res.success){
      ElMessage.success("删除成功");
      props.item.progresses = props.item.progresses.filter(p => p.id !== progress.id);
    }
    else{
      ElMessage.error("删除失败");
    }
  })
}
import completeIcon from "../../../../assets/home/complete.svg";
import addIcon from "../../../../assets/home/add.png";
import editIcon from "../../../../assets/home/edit.svg";
import closeIcon from "../../../../assets/home/close.png";

const props = defineProps({
  item: Object,
});

const progresses = computed(() => props.item.progresses);
const progressBar = ref([]);

let dragging = false;

function updateProgressFromPosition(clientX, index) {
  const bar = progressBar.value;
  if (!bar[index]) return;
  const rect = bar[index].getBoundingClientRect();
  let newProgress = (clientX - rect.left) / rect.width;
  newProgress = Math.min(1, Math.max(0, newProgress));
  progresses.value[index].totalProgress = newProgress;

  // 这里简单更新第一个未完成里程碑currentValue，保持示例简单
  const milestone = progresses.value[index].milestones.find(
    (m) => !m.completed
  );
  if (milestone) {
    milestone.currentValue = Math.round(milestone.targetValue * newProgress);
    milestone.completed = milestone.currentValue >= milestone.targetValue;
  }
}

let moveHandler = null;
let upHandler = null;

function handleDragStart(e, index) {
  dragging = true;
  updateProgressFromPosition(e.clientX, index);

  moveHandler = (ev) => handleDragging(ev, index);
  upHandler = () => handleDragEnd();

  window.addEventListener("mousemove", moveHandler);
  window.addEventListener("mouseup", upHandler);
}

function handleDragging(e, index) {
  if (!dragging) return;
  updateProgressFromPosition(e.clientX, index);
}

function handleDragEnd() {
  dragging = false;
  window.removeEventListener("mousemove", moveHandler);
  window.removeEventListener("mouseup", upHandler);

  saveProgressDebounce();
}

onBeforeUnmount(() => {
  window.removeEventListener("mousemove", handleDragging);
  window.removeEventListener("mouseup", handleDragEnd);
});

// 弹窗
// 弹窗显示
const dialogVisible = ref(false);

// 表单数据
const form = ref({
  title: "",
  description: "",
  startDate: "",
  milestones: [],
  endDate: "",
  priority: "medium",
  tags: [],
});

// 临时输入标签
const tagInput = ref("");
// 打开弹窗
function openDialog() {
  submitMode.value = "add";
  dialogVisible.value = true;
  form.value = {
    title: "",
    description: "",
    milestones: [],
    startDate: "",
    endDate: "",
    priority: "medium",
    tags: [],
  };
  tagInput.value = "";
}

// 添加标签
function addTags() {
  if (!tagInput.value) return;
  const newTags = tagInput.value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t);
  form.value.tags.push(...newTags);
  tagInput.value = "";
}

// 删除标签
function removeTag(index) {
  form.value.tags.splice(index, 1);
}

const addMilestone = () => {
  form.value.milestones.push({
    id: `m-${Date.now()}`,
    title: "",
    targetValue: 100,
    currentValue: 0,
    dueDate: "",
    completed: false,
  });
};

const removeMilestone = (index) => {
  form.value.milestones.splice(index, 1);
};

// 确认新增
import { useRepositoryStore } from "../../../../store/repository";
const repositoryStore = useRepositoryStore();
async function confirmEdit(){
  if (!form.value.title) {
    alert("请填写标题");
    return;
  }
  dialogVisible.value = false;
  saveProgressDebounce();
}
async function confirmAdd() {
  if (!form.value.title) {
    alert("请填写标题");
    return;
  }

  const newTask = {
    ...form.value,
    id: "task-" + Date.now(),
    title: form.value.title,
    description: form.value.description,
    totalProgress: 0,
    startDate: form.value.startDate,
    endDate: form.value.endDate,
    status: "in-progress",
    priority: form.value.priority,
    tags: form.value.tags,
  };

  progresses.value.push(newTask);
  dialogVisible.value = false;

  saveProgressDebounce();
}

async function saveProgress() {
  await repositoryStore.loadRepositories();
  const preload = {
    path: `${repositoryStore.recentRepositories[0].path}\\.mindforge\\我的成就.achieve`,
    saveContent: JSON.stringify({
      progresses: [
        {
          id: props.item.id,
          title: props.item.title,
          type: props.item.type,
          urgency: props.item.urgency,
          progresses: progresses.value,
        },
      ],
    }),
  };
  window.electronAPI.saveProgress(preload).then((res) => {
    if (res.success) {
      console.log("新增成功");
    } else {
      console.log("新增失败：", res);
    }
  });
}
import { debounce } from "lodash";
import { ElMessage } from "element-plus";
const saveProgressDebounce = debounce(() => {
  saveProgress();
}, 1000);
</script>

<style scoped>
.container {
  height: 100%;
  width: 100%;

  overflow-y: auto;

  position: relative;
}
.absolute-part {
  position: absolute;
  top: 16px;
  right: 16px;

  width: auto;
  height: auto;
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

.progress-area {
  width: 90%;
  min-width: 600px;
  height: 200px;
  user-select: none;
  font-family: "Segoe UI", Arial, sans-serif;
  margin: 20px auto;
  margin-top: 72px;
  padding: 32px;

  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);

  /* 玻璃磨砂渐变背景 */
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.05)
  );
  backdrop-filter: blur(12px);

  /* 柔和阴影 */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15),
              inset 0 0 10px rgba(255, 255, 255, 0.05);

  position: relative;

  /* 轻微动画效果 */
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.progress-area:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25),
              inset 0 0 12px rgba(255, 255, 255, 0.08);
}
.button-container{
  width: 24px;
  height: 24px;

  display: flex;
  justify-content: center;
  align-items: center;

  position: absolute;
  opacity: 0;

  transition: all 0.2s ease;

  border-radius: 4px;
}
.button-container:hover {
  background-color: #e4e4e4;
}
.button {
  width: 20px;
  height: 20px;

  object-fit: cover;
}
.progress-area:hover .button-container{
  opacity: 1;
}


.complete-img {
  width: 24px;
  height: 24px;

  object-fit: cover;

  position: absolute;

  top: 16px;
  left: 16px;
}

.progress-bar {
  position: relative;
  height: 24px;
  background: #eee;
  border-radius: 12px;
  cursor: pointer;
}

.progress-fill {
  height: 100%;
  background: #409eff;
  border-radius: 12px 0 0 12px;
  transition: width 0.2s ease;
}

.milestone {
  position: absolute;
  top: -45px;
  transform: translateX(-50%);
  text-align: center;
  white-space: nowrap;
  user-select: none;
}

.milestone-dot {
  width: 12px;
  height: 12px;
  background: #409eff;
  border-radius: 50%;
  margin: 0 auto;
  box-shadow: 0 0 5px rgba(64, 158, 255, 0.7);
}
.milestone-dot.completed {
  width: 12px;
  height: 12px;

  background-color: #f9d32a;
  border-radius: 50%;
  margin: 0 auto;
  box-shadow: 0 0 5px rgba(255, 215, 17, 0.7);
}

.milestone-label {
  font-size: 12px;
  color: #333;
  margin-top: 4px;
}

.progress-up-triangle {
  position: absolute;
  bottom: 100%;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 10px solid #409eff;
  transform: translateX(-50%);
  pointer-events: none;
}
.progress-triangle {
  position: absolute;
  top: 100%;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 10px solid #409eff;
  transform: translateX(-50%);
  pointer-events: none;
}

.drag-handle {
  position: absolute;
  top: 50%;
  width: 18px;
  height: 18px;
  background: #fff;
  border: 2px solid #409eff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  box-shadow: 0 0 5px rgba(64, 158, 255, 0.8);
}
.progress-text {
  margin-top: 8px;
  font-size: 14px;
  text-align: center;
  color: #555;
}
.tag-list {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
}
</style>
