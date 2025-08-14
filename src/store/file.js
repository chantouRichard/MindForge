import { defineStore } from 'pinia';

export const useFileStore = defineStore('file', {
  state: () => ({
    filePath: "",
    fileTitle: "",
    fileContent: "",
    currentRightSelectedItem:null,
    renamingItem:null,
    InspirationContent: "",

    Schedules: null,
    ScheduleMode: "",
    ScheduleSelected: "",

    // 成就面板相关状态
    AchievementMode: "",
    AchievementSelected: "",

    albums:[],
  }),
  actions: {
    setfilePath(path) {
      this.filePath = path;
    },
    setfileTitle(title) {
      this.fileTitle = title;
    },
    setfileContent(content) {
      this.fileContent = content;
    },
    setCurrentRightSelectedItem(data) {
      this.currentRightSelectedItem = data;
    },
    setRenamingItem(data) {
      this.renamingItem = data;
    },
    setInspirationContent(content) {
      this.InspirationContent = content;
    },
    setSchedules(schedules) {
      this.Schedules = schedules;
    },
    setScheduleMode(mode) {
      this.ScheduleMode = mode;
    },
    setScheduleSelected(data) {
      this.ScheduleSelected = data;
    },

    // 成就面板相关方法
    setAchievementMode(mode) {
      this.AchievementMode = mode;
    },
    setAchievementSelected(data) {
      this.AchievementSelected = data;
    },
    // 相册
    setAlbums(data) {
      this.albums = data
    }
  }
});
