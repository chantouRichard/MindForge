<template>
  <section class="my-gantt">
    <div id="gantt_here" class="gantt-container"></div>
  </section>
</template>

<script setup>
import {
  reactive,
  toRefs,
  onBeforeMount,
  onMounted,
  watchEffect,
  defineExpose,
  defineProps,
  watch,
} from "vue";

const props = defineProps({
  tasks: { Array, default: () => [] },
  startDate: { type: String, required: true }, // 例如 "2025-08-10"
  endDate: { type: String, required: true }, // 例如 "2025-08-17"
});

import { gantt } from "dhtmlx-gantt";
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";
const demoData = {
  data: [
    {
      id: 1,
      text: "Project #2",
      start_date: "08-08-2025",
      duration: "18",
      progress: 0.4,
      open: true,
    },

    {
      id: 2,
      text: "Task #1",
      start_date: "08-08-2025",
      duration: "8",
      parent: "1",
      progress: 0.5,
      open: true,
    },
    {
      id: 3,
      text: "Task #2",
      start_date: "08-15-2025",
      duration: "8",
      parent: "1",
      progress: 0.6,
      open: true,
    },
  ],
  links: [
    { id: "1", source: "1", target: "2", type: "1" },
    { id: "2", source: "2", target: "3", type: "0" },
  ],
};

const data = reactive({});

//初始化甘特图
const initGantt = () => {
  gantt.config.grid_width = 150;
  gantt.config.add_column = false; //添加符号

  //时间轴图表中，如果不设置，只有行边框，区分上下的任务，设置之后带有列的边框，整个时间轴变成格子状。
  gantt.config.autofit = false;
  gantt.config.scale_height = 60;
  gantt.config.row_height = 60;
  gantt.config.bar_height = 34;
  // gantt.config.fit_tasks = true //自动延长时间刻度，以适应所有显示的任务
  gantt.config.auto_types = true; //将包含子任务的任务转换为项目，将没有子任务的项目转换回任务
  gantt.config.xml_date = "%m-%d-%Y"; //甘特图时间格式
  gantt.config.readonly = false; //是否只读
  gantt.config.show_grid = true; //是否显示侧边栏

  gantt.templates.task_class = function (start, end, item) {
    switch (item.status) {
      case "400": // 已完成
        return "gantt_success";
      case "100": // 未开始
        return "gantt_begined";
      case "200": // 进行中
        return "gantt_primary";
      case "300": // 暂停
        return "gantt_warning";
      default: // 已终止 500
        return "gantt_info";
    }
  };
  gantt.config.columns = [
    // {
    //   name: "text",
    //   label: "项目名称",
    //   tree: true,
    //   width: "120",
    //   align: "left",
    //   template: (task) => {
    //     if (task.parent) {
    //       return task.text;
    //     } else {
    //       return `<div style="font-weight: 700">${task.text}</div>`;
    //     }
    //   },
    // },
    // { name: "person", label: "项目成员", width: "100", align: "center" },
    {
      name: "add", // dhtmlx-gantt 内置的 "add" 类型列
      label: "", // 这里可以留空
      width: 44, // 只够显示加号的宽度
      align: "center",
    },
  ];
  gantt.config.drag_project = true;

  gantt.config.fit_tasks = false;
  gantt.config.start_date = new Date(props.startDate);
  gantt.config.end_date = new Date(props.endDate);

  gantt.config.scales = [
    { unit: "month", step: 1, date: " %Y 年  %F" },
    {
      unit: "day",
      step: 1,
      date: "%d",
      template: function (date) {
        const dayNames = [
          "周日",
          "周一",
          "周二",
          "周三",
          "周四",
          "周五",
          "周六",
        ];
        const dayName = dayNames[date.getDay()];
        const dayNum = gantt.date.date_to_str("%d")(date);
        return dayNum + " " + dayName;
      },
    },
  ];

  gantt.plugins({
    tooltip: true, // 启用 tooltip 插件
  });

  gantt.templates.tooltip_text = (start, end, task) => {};
  // 仅仅渲染在屏幕可见的那部分时间轴。在处理时间轴非常长的时候，可以提升性能
  //   gantt.config.smart_scales = true;
  // 按需渲染, 仅仅渲染在屏幕可见的那部分任务和依赖线。这个在显示大量的任务时，性能比较高。
  //   gantt.config.smart_rendering = true;
  // 格式化日期
  // gantt.locale.date = {
  // 		month_full: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  // 		month_short: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  // 		day_full: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  // 		day_short: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  // };
  gantt.i18n.setLocale("cn"); //设置语言
  gantt.init("gantt_here"); //初始化
  if (props.tasks.length == 0 && props.tasks) gantt.parse(demoData);
  else gantt.parse(props.tasks); //填充数据
};

onBeforeMount(() => {});
onMounted(() => {
  initGantt();
});
watchEffect(() => {});
defineExpose({
  ...toRefs(data),
});
watch(
  () => props.tasks,
  (newVal) => {
    console.log("任务数据变化：", newVal);
    if (newVal.data.length > 0) {
      gantt.clearAll(); // 清空原有数据
      gantt.config.start_date = new Date(props.startDate);
      gantt.config.end_date = new Date(props.endDate);
      gantt.parse(newVal);
    } // 填充新数据
  }
);

// 保存数据
import { useFileStore } from "../../../store/file";
const fileStore = useFileStore();
async function saveAllData() {
  let allData = gantt.serialize(); // { data: [...], links: [...] }

  // 过滤掉空任务
  allData.data = allData.data.filter((task) => {
    // 这里可以自定义判断条件
    return task.text && task.text.trim() !== "" && task.duration > 0;
  });

  // 过滤掉无效的 links（只保留连接到有效任务的）
  const validIds = new Set(allData.data.map((task) => task.id));
  allData.links = allData.links.filter(
    (link) => validIds.has(link.source) && validIds.has(link.target)
  );

  console.log("保存全部数据（去掉空行）：", allData);

  // 保存
  await window.electronAPI.saveWeekSchedule({
    path: fileStore.filePath,
    saveContent: JSON.stringify({ WeekSchedules: allData }),
  });

  // 重新读取文件
  const res = await window.electronAPI.readFileContent(fileStore.filePath);
  const parsedData = JSON.parse(res.content);

  fileStore.setSchedules(parsedData);
}

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

const saveDebounced = debounce(saveAllData, 500); // 防抖，避免频繁写文件

gantt.attachEvent("onAfterTaskAdd", saveDebounced);
gantt.attachEvent("onAfterTaskUpdate", saveDebounced);
gantt.attachEvent("onAfterTaskDelete", saveDebounced);

gantt.attachEvent("onAfterLinkAdd", saveDebounced);
gantt.attachEvent("onAfterLinkUpdate", saveDebounced);
gantt.attachEvent("onAfterLinkDelete", saveDebounced);
</script>
<style scoped lang="less">
.my-gantt {
  height: calc(100vh - 40px);
  min-height: 700px;
  width: 100%;
  .gantt-container {
    width: 100%;
    height: 100%;
  }
}

/deep/ .gantt_success .gantt_task_progress {
  background: #13c400 !important;
  border: none !important;
}
/deep/ .gantt_primary .gantt_task_progress {
  background: #3a84ff !important;
  border: none !important;
}
/deep/ .gantt_begined .gantt_task_progress {
  background: #9a9a9a !important;
  border: none !important;
}
/deep/ .gantt_info .gantt_task_progress {
  background: #fe0000 !important;
  border: none !important;
}
/deep/ .gantt_warning .gantt_task_progress {
  background: #ff7700 !important;
  border: none !important;
}
</style>
