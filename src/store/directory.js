import { defineStore } from 'pinia';

export const useDirectoryStore = defineStore('directory', {
  state: () => ({
    directoryDirty: false,
    expandedPaths: new Set(),
    isExpand: Boolean,
    isCollapse: Boolean,
  }),
  actions: {
    markDirty() {
      this.directoryDirty = true;
    },
    clearDirty() {
      this.directoryDirty = false;
    },
    setExpandedPaths(paths) {
      this.expandedPaths = paths;
    },
    setExpand(isExpand) {
      this.isExpand = isExpand;
    },
    setCollapse(isCollapse) {
      this.isCollapse = isCollapse;
    },
  }
});
