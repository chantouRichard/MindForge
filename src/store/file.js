import { defineStore } from 'pinia';

export const useFileStore = defineStore('file', {
  state: () => ({
    filePath: "",
    fileTitle: "",
    fileContent: "",
    currentRightSelectedItem:null,
    renamingItem:null,
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
  }
});
