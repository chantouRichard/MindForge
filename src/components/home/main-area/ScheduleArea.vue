<template>
  <div class="container" v-if="ScheduleMode == 'day'">
    <div class="schedule-header">
      <!-- <el-date-picker
        v-model="selectedDate"
        type="date"
        @change="loadSchedule"
      /> -->
      日程计划
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
        <div
          class="schedule-body"
          v-for="(day, index) in selectedDays"
          :key="day"
          :style="{ position: 'relative', minHeight: hourHeight * 24 + 'px' }"
        >
          <div class="schedule-date" :class="{ today: day === highlightDay }">
            {{ day }}
          </div>

          <!-- 24小时背景格子 -->
          <div
            class="time-slot"
            v-for="hour in 24"
            :key="hour"
            @click="createEvent(hour - 1, day)"
            :data-hour="hour - 1"
          >
            <div class="time-label" v-if="index == 3">
              {{ formatHour(hour - 1) }}
            </div>
          </div>

          <!-- 事件绝对定位渲染 -->
          <div
            v-for="event in eventsAtDay(day)"
            :key="event.id"
            class="event-block"
            :style="getEventStyle(event)"
            @click.stop="editEvent(event)"
          >
            {{ event.title }}
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
          <el-button
            v-if="dialogTitle == '编辑日程安排'"
            type=""
            @click="deleteEvent"
            >删除</el-button
          >
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEvent">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
  <div v-else-if="ScheduleMode == 'week'">
    <WeekGantt :tasks="WeekTasks" :startDate="startDate" :endDate="endDate" />
  </div>
  <div v-else-if="ScheduleMode == 'month'">
    <MonthGantt :tasks="MonthTasks" :startDate="startDate" :endDate="endDate" />
  </div>
  <div v-else-if="ScheduleMode == 'year'">
    <YearGantt :tasks="YearTasks" :startDate="startDate" :endDate="endDate" />
  </div>
  <div v-else class="intro-container">
    <div style="width: 80%; display: flex; align-items: flex-start">
      <img :src="introdirectionIcon" class="icon" />
    </div>
    在这里可以查看你的日程安排<br>
    制定属于你自己的计划表

    <button class="introbutton" @click="todaySchedule">查看今日计划</button>
  </div>
</template>

<script setup>
import WeekGantt from "./WeekGantt.vue";
import MonthGantt from "./MonthGantt.vue";
import YearGantt from "./YearGantt.vue";

import introdirectionIcon from "../../../assets/home/introdirection.jpg";
// 查看今日计划
const todaySchedule = () => {
    ScheduleMode.value = "day";
    fileStore.setScheduleMode("day");
    fileStore.setScheduleSelected(Date.now());
}
// 保存到计划文件里面
const saveSchedules = async () => {
  const saveContent = { schedules: events.value };
  // 注意这里要先把响应式对象转换成普通对象，再 stringify
  const rawSchedules = JSON.parse(JSON.stringify(saveContent)); // 转普通对象并去除 Proxy
  const jsonStr = JSON.stringify(rawSchedules); // 字符串

  let res = await window.electronAPI.saveSchedule({
    path: fileStore.filePath,
    saveContent: jsonStr, // 传字符串
  });

  res = await window.electronAPI.readFileContent(fileStore.filePath);
  const parsedData = JSON.parse(res.content);

  fileStore.setSchedules(parsedData);
};

import { ref } from "vue";
import dayjs from "dayjs";

// 今天
const today = dayjs(new Date()).format("M月D日");
const highlightDay = ref(today);
const selectedDays = ref(["1", "2", "3", "4", "5", "6", "7"]);

const getWeekDays = (date) => {
  const startOfWeek = dayjs(date).startOf("week");
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(startOfWeek.add(i, "day").format("M月D日"));
  }

  selectedDays.value = days;
};

// 随机颜色块
const randomColor = () => {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
};
const getDateByDay = (day) => {
  if (typeof day === "number") {
    // 之前的逻辑，传数字1~7
    const startOfWeek = dayjs(selectedDate.value).startOf("week"); // 默认周日开始
    return startOfWeek.add(day - 1, "day");
  } else if (typeof day === "string") {
    // 处理 "8月10日" 这种格式
    const year = dayjs(selectedDate.value).year();
    return dayjs(
      `${year}-${day.replace("月", "-").replace("日", "")}`,
      "YYYY-M-D"
    );
  }
};

const selectedDate = ref(new Date());
const events = ref([
  {
    id: 1,
    title: "示例事件1",
    start: "2025-08-11T09:00",
    end: "2025-08-11T10:00",
    color: "#4cafef",
  },
  {
    id: 2,
    title: "示例事件2",
    start: "2025-08-12T14:00",
    end: "2025-08-12T16:30",
    color: "#ff5722",
  },
]);

const dialogTitle = ref("创建日程安排");
const dialogVisible = ref(false);
const form = ref({
  title: "",
  startTime: null,
  endTime: null,
  color: randomColor(),
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
  dialogTitle.value = "创建日程安排";
  form.value.title = "";
  const date = getDateByDay(day).toDate();

  form.value.startTime = new Date(date);
  form.value.startTime.setHours(hour, 0, 0, 0);

  form.value.endTime = new Date(date);
  form.value.endTime.setHours(hour + 1, 0, 0, 0);

  form.value.color = randomColor();
  dialogVisible.value = true;
};

const saveEvent = () => {
  if (!form.value.title || !form.value.startTime || !form.value.endTime) {
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
  saveSchedules();
  dialogVisible.value = false;
  editingEventId.value = null; // 清除编辑状态
};

const deleteEvent = () => {
  const idx = events.value.findIndex((e) => e.id === editingEventId.value);
  if (idx !== -1) {
    events.value.splice(idx, 1);
  }
  saveSchedules();
  dialogVisible.value = false;
  editingEventId.value = null; // 清除编辑状态
};

const loadSchedule = () => {
  // TODO: 从 API 或本地存储加载
};

import { nextTick, watch, computed } from "vue";
import { ElMessage } from "element-plus";

const syncTimeSlotHeights = () => {
  for (let h = 0; h < 24; h++) {
    const slots = document.querySelectorAll(`.time-slot[data-hour="${h}"]`);
    if (slots.length === 0) continue;

    let maxHeight = 0;
    slots.forEach((slot) => {
      slot.style.height = "auto"; // 清除固定高
    });

    // 计算最大占用高度
    slots.forEach((slot) => {
      const eventBlocks = slot.querySelectorAll(".event-block"); // 你事件块类名
      let slotMax = 0;

      eventBlocks.forEach((block) => {
        const top = parseFloat(block.style.top) || 0;
        const height = block.offsetHeight;
        const totalHeight = top + height;

        if (totalHeight > slotMax) slotMax = totalHeight;
      });

      // 如果没有事件块，默认行高为40px（或你定义的行高）
      if (slotMax === 0) slotMax = 40;

      if (slotMax > maxHeight) maxHeight = slotMax;
    });

    slots.forEach((slot) => {
      slot.style.height = maxHeight + "px";
    });
  }
};

// 在视图渲染完后执行一次
import { useFileStore } from "../../../store/file";
const fileStore = useFileStore();
const ScheduleMode = computed(() => fileStore.ScheduleMode);
const ScheduleSelected = computed(() => fileStore.ScheduleSelected);

watch(
  () => events.value.map((e) => e.title + e.start + e.end + e.color).join(","),
  async () => {
    await nextTick();
    syncTimeSlotHeights();
  }
);
watch(
  () => fileStore.ScheduleSelected,
  async () => {
    switch (fileStore.ScheduleMode) {
      case "day":
        initDate();
        break;
      case "week":
        initWeek();
        break;
      case "month":
        initMonth();
        break;
      case "year":
        initYear();
        break;
    }
  }
);

// 渲染数据
const initDate = () => {
  // 1. 获取这一周的日期数组
  getWeekDays(ScheduleSelected.value);

  // 2. 计算这一周的开始和结束
  const startOfWeek = dayjs(ScheduleSelected.value).startOf("week"); // 周日开始
  const endOfWeek = startOfWeek.add(6, "day").endOf("day");

  // 3. 筛选出这一周的事件
  const weekEvents = fileStore.Schedules.schedules.filter((e) => {
    const start = dayjs(e.start);
    return start.isAfter(startOfWeek) && start.isBefore(endOfWeek);
  });

  // 4. 赋值给 events
  events.value = weekEvents;
};

// 渲染周计划
const WeekTasks = ref([]);
const MonthTasks = ref([]);
const YearTasks = ref([]);
const startDate = ref("");
const endDate = ref("");

const initWeek = async () => {
  // 周日日期
  const sunday = dayjs(ScheduleSelected.value);

  const start = sunday.subtract(0, "day");
  const end = sunday.add(7, "day");

  // 格式化成 MM-DD-YYYY
  const startStr = start.format("MM-DD-YYYY");
  const endStr = end.format("MM-DD-YYYY");

  // 获取全部数据
  const allData = JSON.parse(
    JSON.stringify(fileStore.Schedules.WeekSchedules.data)
  );
  const allLinks = JSON.parse(
    JSON.stringify(fileStore.Schedules.WeekSchedules.links)
  );

  // 筛选 data
  let filteredData = allData.filter((item) => {
    const date = dayjs(item.start_date, "MM-DD-YYYY");
    return date.isSameOrAfter(start, "day") && date.isSameOrBefore(end, "day");
  });

  // 筛选 links（只保留与 filteredData 有关的链接）
  const filteredLinks = allLinks.filter((link) => {
    return filteredData.some(
      (task) => task.id === link.source || task.id === link.target
    );
  });
  if (filteredData.length === 0) {
    filteredData = [
      {
        id: 1,
        text: "",
        start_date: startStr,
        duration: 0,
        open: true,
        $empty: true,
      },
      {
        id: 2,
        text: "",
        start_date: startStr,
        duration: 0,
        open: true,
        $empty: true,
      },
      {
        id: 3,
        text: "",
        start_date: startStr,
        duration: 0,
        open: true,
        $empty: true,
      },
    ];
  }
  // 打包并赋值
  startDate.value = startStr;
  endDate.value = endStr;
  WeekTasks.value = {
    data: filteredData,
    links: filteredLinks,
  };
};
// 渲染月计划
const initMonth = async () => {
  console.log("初始化月计划: ", ScheduleSelected.value);
  // 周日日期
  const Day = dayjs(ScheduleSelected.value);

  const start = Day.startOf("month"); // 月初
  const end = Day.endOf("month").add(1, "day"); // 月末

  // 格式化成 MM-DD-YYYY
  const startStr = start.format("MM-DD-YYYY");
  const endStr = end.format("MM-DD-YYYY");

  // 获取全部数据
  const allData = JSON.parse(
    JSON.stringify(fileStore.Schedules.WeekSchedules.data)
  );
  const allLinks = JSON.parse(
    JSON.stringify(fileStore.Schedules.WeekSchedules.links)
  );

  // 筛选 data
  let filteredData = allData.filter((item) => {
    const date = dayjs(item.start_date, "MM-DD-YYYY");
    return date.isSameOrAfter(start, "day") && date.isSameOrBefore(end, "day");
  });

  // 筛选 links（只保留与 filteredData 有关的链接）
  const filteredLinks = allLinks.filter((link) => {
    return filteredData.some(
      (task) => task.id === link.source || task.id === link.target
    );
  });
  if (filteredData.length === 0) {
    filteredData = [
      { id: 1, text: "", start_date: startStr, duration: 0, open: true },
      { id: 2, text: "", start_date: startStr, duration: 0, open: true },
      { id: 3, text: "", start_date: startStr, duration: 0, open: true },
    ];
  }
  // 打包并赋值
  startDate.value = startStr;
  endDate.value = endStr;
  MonthTasks.value = {
    data: filteredData,
    links: filteredLinks,
  };
  console.log("MonthTasks: ", MonthTasks.value);
};

// 渲染年计划
const initYear = async () => {
  // 当前年份
  const current = dayjs(ScheduleSelected.value);
  const start = current.startOf("year"); // 年初 1月1日
  const end = current.endOf("year"); // 年末 12月31日

  // 格式化成 MM-DD-YYYY
  const startStr = start.format("MM-DD-YYYY");
  const endStr = end.format("MM-DD-YYYY");

  // 获取全部数据
  const allData = JSON.parse(
    JSON.stringify(fileStore.Schedules.YearSchedules?.data || [])
  );
  const allLinks = JSON.parse(
    JSON.stringify(fileStore.Schedules.YearSchedules?.links || [])
  );

  // 筛选 data（只保留一年范围内的任务）
  let filteredData = allData.filter((item) => {
    const date = dayjs(item.start_date, "MM-DD-YYYY");
    return date.isSameOrAfter(start, "day") && date.isSameOrBefore(end, "day");
  });

  // 筛选 links（只保留与 filteredData 有关的链接）
  const filteredLinks = allLinks.filter((link) => {
    return filteredData.some(
      (task) => task.id === link.source || task.id === link.target
    );
  });

  // 如果一年内没有任务，就预留 3 条空行
  if (filteredData.length === 0) {
    filteredData = [
      {
        id: 1,
        text: "",
        start_date: startStr,
        duration: 0,
        open: true,
        $empty: true,
      },
      {
        id: 2,
        text: "",
        start_date: startStr,
        duration: 0,
        open: true,
        $empty: true,
      },
      {
        id: 3,
        text: "",
        start_date: startStr,
        duration: 0,
        open: true,
        $empty: true,
      },
    ];
  }

  // 保存到响应式变量
  startDate.value = startStr;
  endDate.value = endStr;
  YearTasks.value = {
    data: filteredData,
    links: filteredLinks,
  };
};

// 也可以监听窗口尺寸变化，防抖执行
window.addEventListener("resize", () => {
  syncTimeSlotHeights();
});

const hourHeight = 72; // 你定义的每小时高度

// 根据day获取这天所有事件
const eventsAtDay = (day) => {
  // 从 selectedDate 取年份
  const year = dayjs(selectedDate.value).year();
  highlightDay.value = dayjs(selectedDate.value).format("M月D日");

  // 把 "8月11日" 解析成 dayjs 对象
  const date = dayjs(
    `${year}-${day.replace("月", "-").replace("日", "")}`,
    "YYYY-M-D"
  );

  return events.value.filter((e) => dayjs(e.start).isSame(date, "day"));
};

// 计算事件样式（top和height）
const getEventStyle = (event) => {
  const date = dayjs(event.start).startOf("day"); // 当天0点
  const start = dayjs(event.start);
  const end = dayjs(event.end);

  // 事件开始距离当天0点的分钟数
  const startMinutes = start.diff(date, "minute");
  // 事件持续分钟数
  const durationMinutes = end.diff(start, "minute");

  return {
    position: "absolute",
    top: (startMinutes / 60) * hourHeight + 32 + "px",
    height: (durationMinutes / 60) * hourHeight + "px",
    left: "2px",
    right: "2px",
    backgroundColor: event.color,
    color: "#fff",
    borderRadius: "4px",
    padding: "2px 4px",
    fontSize: "12px",
    cursor: "pointer",
    overflow: "hidden",
    whiteSpace: "wrap",
    textOverflow: "ellipsis",
  };
};
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

  font-size: 20px;
  font-weight: bold;
}

.schedule-body {
  position: relative;
  border: 1px solid #ccc;
  border-radius: 4px;

  width: 15%;

  min-width: 64px;
  min-height: 24 * hourHeight;
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

.today {
  background-color: rgb(85, 178, 249);
  color: white;
  border-radius: 4px;
}

.time-slot {
  display: flex;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  min-height: 72px;
  align-items: center;
  justify-content: flex-end;
  padding-right: 5px;
  background: #f5f5f5;

  position: relative;
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

  word-break: break-all;
  flex-wrap: wrap;
}

.event {
  padding: 2px 4px;
  font-size: 12px;
  color: #fff;
  border-radius: 3px;

  word-break: break-all;
  flex-wrap: wrap;
}

.event-block {
  position: absolute;
  box-sizing: border-box;
  z-index: 10;
  user-select: none;

  display: flex;
  justify-content: center;
  align-items: center;

  word-break: break-all;
  flex-wrap: wrap;

  max-width: 100%; /* 限制最大宽度 */
  white-space: normal; /* 允许换行 */
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
