<template>
  <div class="container">
    <div class="schedule-header">
      <el-date-picker
        v-model="selectedDate"
        type="date"
        @change="loadSchedule"
      />
    </div>
    <div class="schedule-area">
      <div class="schedule-container">
        <!-- 左侧小时刻度列 -->
        <div class="time-label-column">
          <div class="schedule-date">Time</div>
          <div
            class="time-slot"
            v-for="hour in 24"
            :key="'label-' + hour"
            :data-hour="hour - 1"
          >
            {{ formatHour(hour - 1) }}
          </div>
        </div>

        <!-- 右侧7天的时间列 -->
        <div class="schedule-body" v-for="day in 7" :key="day">
          <div class="schedule-date">Day {{ day }}</div>

          <div
            class="time-slot"
            v-for="hour in 24"
            :key="hour"
            @click="createEvent(hour - 1, day)"
            :data-hour="hour - 1"
          >
            <div class="time-events">
              <div
                class="event"
                v-for="event in eventsAtHour(hour - 1, day)"
                :key="event.id"
                :style="{ backgroundColor: event.color }"
                @click.stop="editEvent(event)"
              >
                {{ event.title }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 创建任务对话框 -->
      <el-dialog v-model="dialogVisible" :title="dialogTitle">
        <el-input v-model="form.title" placeholder="任务名称" />
        <el-time-picker
          v-model="form.startTime"
          placeholder="开始时间"
          format="HH:mm"
        />
        <el-time-picker
          v-model="form.endTime"
          placeholder="结束时间"
          format="HH:mm"
        />
        <el-color-picker v-model="form.color" />
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEvent">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import dayjs from "dayjs";

const getDateByDay = (day) => {
  // day 是 1~7，代表周一到周日
  // 假设 selectedDate 是这周的某一天，比如周一
  // 计算这周第一天（周一）
  const startOfWeek = dayjs(selectedDate.value).startOf("week").add(1, "day");
  // 这里用 startOf('week') +1 是为了得到周一（根据你周起始日可能要调整）
  return startOfWeek.add(day - 1, "day");
};

const selectedDate = ref(new Date());
const events = ref([
  {
    id: 1,
    title: "示例事件1",
    start: "2025-08-11T09:00",
    end: "2025-08-11T10:00",
    color: "#4cafef"
  },
  {
    id: 2,
    title: "示例事件2",
    start: "2025-08-12T14:00",
    end: "2025-08-12T16:30",
    color: "#ff5722"
  }
]);

const dialogTitle = ref("创建日程安排");
const dialogVisible = ref(false);
const form = ref({
  title: "",
  startTime: null,
  endTime: null,
  color: "#4cafef",
});
let clickedHour = null;

const formatHour = (hour) => `${hour.toString().padStart(2, "0")}:00`;

const eventsAtHour = (hour, day) => {
  const date = getDateByDay(day);
  return events.value.filter((e) => {
    const start = dayjs(e.start);
    const end = dayjs(e.end);

    // 判断事件是否在该日期的该小时区间内
    return (
      start.isSame(date, "day") && hour >= start.hour() && hour < end.hour()
    );
  });
};

// 编辑事件
const editingEventId = ref(null); // 新增编辑事件id标记

const editEvent = (event) => {
  editingEventId.value = event.id;
  form.value.title = event.title;
  form.value.startTime = new Date(event.start);
  form.value.endTime = new Date(event.end);
  form.value.color = event.color;

  dialogTitle.value = "编辑日程安排";
  dialogVisible.value = true;
};
const createEvent = (hour, day) => {
  editingEventId.value = null; // 清除编辑状态
  form.value.title = "";
  const date = getDateByDay(day).toDate();

  form.value.startTime = new Date(date);
  form.value.startTime.setHours(hour, 0, 0, 0);

  form.value.endTime = new Date(date);
  form.value.endTime.setHours(hour + 1, 0, 0, 0);

  form.value.color = "#4cafef";
  dialogVisible.value = true;
};

const saveEvent = () => {
    if(!form.value.title || !form.value.startTime || !form.value.endTime) {
      ElMessage.info("请填写完整信息");
      return;
    }
  if (editingEventId.value) {
    // 编辑已有事件
    const idx = events.value.findIndex((e) => e.id === editingEventId.value);
    if (idx !== -1) {
      events.value[idx] = {
        id: editingEventId.value,
        title: form.value.title,
        start: dayjs(form.value.startTime).format("YYYY-MM-DDTHH:mm"),
        end: dayjs(form.value.endTime).format("YYYY-MM-DDTHH:mm"),
        color: form.value.color,
      };
    }
  } else {
    // 新建事件
    events.value.push({
      id: Date.now(),
      title: form.value.title,
      start: dayjs(form.value.startTime).format("YYYY-MM-DDTHH:mm"),
      end: dayjs(form.value.endTime).format("YYYY-MM-DDTHH:mm"),
      color: form.value.color,
    });
  }
  dialogVisible.value = false;
  editingEventId.value = null; // 清除编辑状态
};

const loadSchedule = () => {
  // TODO: 从 API 或本地存储加载
};

import { nextTick, watch } from "vue";
import { ElMessage } from "element-plus";

const syncTimeSlotHeights = () => {
  // 遍历24小时
  for (let h = 0; h < 24; h++) {
    // 找到所有 data-hour=h 的元素（7个）
    const slots = document.querySelectorAll(`.time-slot[data-hour="${h}"]`);
    if (slots.length === 0) continue;

    // 计算最大高度
    let maxHeight = 0;
    slots.forEach((slot) => {
      // 清除之前行内高度，防止叠加误差
      slot.style.height = "auto";
      const height = slot.offsetHeight;
      if (height > maxHeight) maxHeight = height;
    });

    // 设置所有7个格子的高度为最大高度
    slots.forEach((slot) => {
      slot.style.height = maxHeight + "px";
    });
  }
};

// 在视图渲染完后执行一次
watch(
  () => events.value.map((e) => e.title + e.start + e.end + e.color).join(","),
  async () => {
    await nextTick();
    syncTimeSlotHeights();
  }
);

// 也可以监听窗口尺寸变化，防抖执行
window.addEventListener("resize", () => {
  syncTimeSlotHeights();
});
</script>

<style scoped>
.container {
  width: 100%;
  height: calc(100% - 80px);
}
.schedule-area {
  width: 100%;
  height: 100%;
  margin: auto;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
}
.schedule-container {
  display: flex;
  width: 90%;
  height: 100%;


  gap: 4px;
}

.schedule-header {
    display: flex;
    justify-content: center;
    align-items: center;
  text-align: center;
  margin-bottom: 10px;

  height: 40px;
}

.schedule-body {
  border: 1px solid #ccc;
  border-radius: 4px;

  width: 15%;

  min-width: 64px;
}

.time-label-column {
  width: 64px;
  height: 50%;
}

.schedule-date {
  display: flex;
  justify-content: center;
  align-items: center;

  width: 100%;
  height: 32px;
}

.time-slot {
  display: flex;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  min-height: 40px;
  align-items: center;
  justify-content: flex-end;
  padding-right: 5px;
  background: #f5f5f5;
}

.time-label {
  width: 60px;
  background: #f5f5f5;
  padding: 5px;
  font-size: 12px;
  text-align: right;
}

.time-events {
  flex: 1;
  padding: 5px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.event {
  padding: 2px 4px;
  font-size: 12px;
  color: #fff;
  border-radius: 3px;

  word-break: break-all;
  flex-wrap: wrap;
}
</style>
