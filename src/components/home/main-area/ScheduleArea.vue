<template>
  <div class="schedule-area">
    <div class="schedule-header">
      <el-date-picker
        v-model="selectedDate"
        type="date"
        @change="loadSchedule"
      />
    </div>

    <div class="schedule-body">
      <div
        class="time-slot"
        v-for="hour in 24"
        :key="hour"
        @click="createEvent(hour - 1)"
      >
        <div class="time-label">{{ formatHour(hour - 1) }}</div>
        <div class="time-events">
          <div
            class="event"
            v-for="event in eventsAtHour(hour - 1)"
            :key="event.id"
            :style="{ backgroundColor: event.color }"
          >
            {{ event.title }}
          </div>
        </div>
      </div>
    </div>

    <!-- 创建任务对话框 -->
    <el-dialog v-model="dialogVisible" title="新建任务">
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
</template>

<script setup>
import { ref } from "vue";
import dayjs from "dayjs";

const selectedDate = ref(new Date());
const events = ref([]);

const dialogVisible = ref(false);
const form = ref({
  title: "",
  startTime: null,
  endTime: null,
  color: "#4cafef"
});
let clickedHour = null;

const formatHour = (hour) => `${hour.toString().padStart(2, "0")}:00`;

const eventsAtHour = (hour) => {
  return events.value.filter((e) => {
    const startHour = dayjs(e.start).hour();
    const endHour = dayjs(e.end).hour();
    return hour >= startHour && hour < endHour;
  });
};

const createEvent = (hour) => {
  clickedHour = hour;
  form.value.startTime = new Date(selectedDate.value);
  form.value.startTime.setHours(hour, 0, 0, 0);
  form.value.endTime = new Date(selectedDate.value);
  form.value.endTime.setHours(hour + 1, 0, 0, 0);
  dialogVisible.value = true;
};

const saveEvent = () => {
  events.value.push({
    id: Date.now(),
    title: form.value.title,
    start: dayjs(form.value.startTime).format("YYYY-MM-DDTHH:mm"),
    end: dayjs(form.value.endTime).format("YYYY-MM-DDTHH:mm"),
    color: form.value.color
  });
  dialogVisible.value = false;
};

const loadSchedule = () => {
  // TODO: 从 API 或本地存储加载
};
</script>

<style scoped>
.schedule-area {
  width: 100%;
  max-width: 200px;
  margin: auto;

  overflow-y: auto;
}

.schedule-header {
  text-align: center;
  margin-bottom: 10px;
}

.schedule-body {
  border: 1px solid #ccc;
  border-radius: 4px;
}

.time-slot {
  display: flex;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  min-height: 40px;
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
}
</style>
