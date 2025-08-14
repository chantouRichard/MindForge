<template>
  <div class="calendar-selector">
    <div class="calendar-top">
      <div
        class="calendar-type-container"
        v-for="(mode, index) in calendarMode"
        @click="handleModeClick(mode.value)"
        :key="index"
        @mouseenter="mode.showtip = true"
        @mouseleave="mode.showtip = false"
      >
        <img :src="mode.icon" alt="" class="calendar-type" />
        <TooltipWrapper :text="mode.name" :show="mode.showtip" />
      </div>
    </div>
    <!-- 按日选择 -->
    <div v-if="mode === 'day'" class="picker-box">
      <el-date-picker
        class="date-picker"
        v-model="selectedDate"
        type="date"
        placeholder="选择日期"
        @change="handleDayChange"
      />
    </div>

    <!-- 按周选择 -->
    <div v-if="mode === 'week'" class="picker-box">
      <el-date-picker
        v-model="selectedWeek"
        type="week"
        format="第 ww 周"
        placeholder="选择周"
        @change="handleWeekChange"
      />
    </div>

    <!-- 按月选择 -->
    <div v-if="mode === 'month'" class="picker-box">
      <el-date-picker
        v-model="selectedMonth"
        type="month"
        placeholder="选择月份"
        @change="handleMonthChange"
      />
    </div>

    <!-- 按年选择 -->
    <div v-if="mode === 'year'" class="picker-box">
      <el-date-picker
        v-model="selectedYear"
        type="year"
        placeholder="选择年份"
        @change="handleYearChange"
      />
    </div>
    <!-- 常驻日历 -->
    <div class="calendar-box">
      <el-calendar v-model="calendarValue" @input="handleSelect">
        <!-- 自定义头部 -->
        <template #header="{ date }">
          <div class="calendar-header">
            <div class="circle-btn" @click="prevMonth">‹</div>
            <span class="calendar-title">{{ date }}</span>
            <div class="circle-btn" @click="nextMonth">›</div>
          </div>
        </template>
        <template #dateCell="{ data }">
          <div
            class="custom-date"
            @click="handleSelect(data)"
            :class="{ selected: isSelected(data) }"
          >
            {{ data.day.split("-").pop() }}
          </div>
        </template>
      </el-calendar>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";

const mode = ref("day");
const selectedDate = ref(null);
const selectedWeek = ref(null);
const selectedMonth = ref(null);
const selectedYear = ref(null);
const calendarValue = ref(new Date());
const selectedRange = ref(null);

function prevMonth() {
  const date = new Date(calendarValue.value);
  date.setMonth(date.getMonth() - 1);
  calendarValue.value = date;
}

function nextMonth() {
  const date = new Date(calendarValue.value);
  date.setMonth(date.getMonth() + 1);
  calendarValue.value = date;
}
function handleSelect(data) {
  const date = data instanceof Date ? data : new Date(data.day);

  if (mode.value === "day") {
    console.log("选中日期：", date.toLocaleDateString());
    handleDayChange(date);
    selectedRange.value = [date];
  } else if (mode.value === "week") {
    const start = new Date(date);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - (day - 1));

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    console.log(
      "选中周：",
      start.toLocaleDateString(),
      "~",
      end.toLocaleDateString()
    );
    selectedRange.value = [start, end];
  } else if (mode.value === "month") {
    console.log(
      "选中月份：",
      date.getFullYear(),
      "年",
      date.getMonth() + 1,
      "月"
    );
    selectedRange.value = [
      new Date(date.getFullYear(), date.getMonth(), 1),
      new Date(date.getFullYear(), date.getMonth() + 1, 0),
    ];
  } else if (mode.value === "year") {
    console.log("选中年份：", date.getFullYear());
    selectedRange.value = [
      new Date(date.getFullYear(), 0, 1),
      new Date(date.getFullYear(), 11, 31),
    ];
  }
}

function isSelected(data) {
  if (!selectedRange.value) return false;
  const date = new Date(data.day);
  if (selectedRange.value.length === 1) {
    return date.toDateString() === selectedRange.value[0].toDateString();
  }
  return date >= selectedRange.value[0] && date <= selectedRange.value[1];
}

import TooltipWrapper from "../TooltipWrapper.vue";
import dayIcon from "../../../assets/home/left-panel/day-schedule.svg";
import weekIcon from "../../../assets/home/left-panel/week-schedule.svg";
import monthIcon from "../../../assets/home/left-panel/month-schedule.svg";
import yearIcon from "../../../assets/home/left-panel/year-schedule.svg";
const calendarMode = ref([
  {
    icon: dayIcon,
    name: "日计划",
    value: "day",
    showtip: false,
  },
  {
    icon: weekIcon,
    name: "周计划",
    value: "week",
    showtip: false,
  },
  {
    icon: monthIcon,
    name: "月计划",
    value: "month",
    showtip: false,
  },
  {
    icon: yearIcon,
    name: "年计划",
    value: "year",
    showtip: false,
  },
]);

function handleModeClick(val) {
  mode.value = val;
}

function handleDayChange(val) {
  fileStore.setScheduleMode("day");
  fileStore.setScheduleSelected(val);
}

function handleWeekChange(val) {
  const startOfWeek = new Date(val);
  const endOfWeek = new Date(val);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  fileStore.setScheduleMode("week");
  fileStore.setScheduleSelected(startOfWeek);
}

function handleMonthChange(val) {
  const startOfMonth = new Date(val);
  fileStore.setScheduleMode("month");
  fileStore.setScheduleSelected(startOfMonth);
}

function handleYearChange(val) {
  console.log("选中的年份：", val);
  const startOfYear = new Date(val);
  fileStore.setScheduleMode("year");
  fileStore.setScheduleSelected(startOfYear);
}

// 读取文件
import { useRepositoryStore } from "../../../store/repository";
const repositoryStore = useRepositoryStore();
import { useFileStore } from "../../../store/file";
const fileStore = useFileStore();

const scheduleData = ref([]);
const schedulePath = ref("");

const getScheduleData = async () => {
    console.log("开始读取计划文件");
  await repositoryStore.loadRepositories();
  schedulePath.value = `${repositoryStore.recentRepositories[0].path}\\.mindforge\\我的计划.schedule`;

  window.electronAPI.readFileContent(schedulePath.value).then((res) => {
    if (res.success) {
      try {
        const parsedData = JSON.parse(res.content);
        scheduleData.value = parsedData;
        fileStore.filePath = schedulePath.value;
        fileStore.setSchedules(parsedData);
      } catch (error) {
        console.error("解析JSON文件时出错：", error);
      }
    } else {
      console.error("读取文件失败,开始创建文件：", res.message);
      let content = {
        schedules:[]
      }
      window.electronAPI.newSchedule(schedulePath.value,JSON.stringify(content)).then((res) => {
        if (res.success) {
          console.log("创建文件成功");
          fileStore.filePath = schedulePath.value;
        } else {
          console.error("创建文件失败：", res.message);
        }
      });
    }
  });
};

onMounted(async () => {
  await getScheduleData();
});
</script>

<style scoped>
.calendar-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;

  width: 100%;
  height: 100%;

  overflow: hidden;
}

.calendar-top {
  width: 100%;
  height: 40px;

  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;
  gap: 4px;
}
.calendar-box {
  width: 90%;
  max-width: 400px;
  height: 400px;

  margin-top: 36px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 10px;
}

.circle-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background-color: #409eff;
  color: white;
  font-size: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.circle-btn:hover {
  background-color: #66b1ff;
}

.calendar-title {
  font-weight: bold;
  font-size: 16px;
}
.calendar-type-container {
  display: flex;
  justify-content: center;
  align-items: center;

  width: 40px;
  height: 35px;
  border-radius: 4px;

  -webkit-app-region: no-drag;
  position: relative;
}
.calendar-type-container:hover {
  background-color: #e4e4e4;
}
.calendar-type {
  width: 24px;
  height: 24px;
  transition: transform 0.2s ease;
}

.date-picker {
  width: 90%;
  height: 32px;
}

.picker-box {
  margin-top: 10px;
  width: 90%;
}
</style>
