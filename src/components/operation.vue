<template>
  <teleport to="body">
    <div class="operation">
      <div class="bar-button" @click="minimize">
        <div
          class="bar-img"
          style="background-image: url('/src/assets/welcome/mini.png')"
        ></div>
      </div>
      <div class="bar-button" @click="maxmize" v-if="isHome && !isMax">
        <div
          class="bar-img"
          style="background-image: url('/src/assets/welcome/max.png')"
        ></div>
      </div>
      <div class="bar-button" @click="unmaxmize" v-if="isHome && isMax">
        <div
          class="bar-img"
          style="background-image: url('/src/assets/welcome/unmax.png')"
        ></div>
      </div>
      <div class="bar-button-close" @click="close">
        <div
          class="bar-img"
          style="background-image: url('/src/assets/welcome/close.png')"
        ></div>
      </div>
    </div>
  </teleport>
</template>

<script>
import { useDirectoryStore } from "../store/directory";
import { useFileStore } from "../store/file";
export default {
  name: "operation",
  props: {
    isHome: { type: Boolean, default: false },
  },
  data() {
    return {
      isMax: false,
    };
  },
  methods: {
    minimize() {
      if (window.electronAPI && this.isHome == false)
        window.electronAPI.minimizeWelcome();
      if (window.electronAPI && this.isHome == true)
        window.electronAPI.minimizeHome();
    },
    maxmize() {
      if (window.electronAPI) {
        window.electronAPI.maximizeHome();
        this.isMax = true;
      }
    },
    unmaxmize() {
      if (window.electronAPI) {
        window.electronAPI.unmaximizeHome();
        this.isMax = false;
      }
    },
    close() {
      const directoryStore = useDirectoryStore();
      const fileStore = useFileStore();
      console.log("保存展开：", Array.from(directoryStore.expandedPaths));
      console.log("保存最后打开的文件：", fileStore.filePath);
      console.log("保存最后打开的时间：", new Date().getTime());

      window.electronAPI.saveExpandedPaths(
        Array.from(directoryStore.expandedPaths)
      );
      window.electronAPI.saveLastFilePath(fileStore.filePath);
      window.electronAPI.saveLastOpenTime(new Date().getTime());
      if (window.electronAPI && this.isHome == false)
        window.electronAPI.closeWelcome();
      if (window.electronAPI && this.isHome == true)
        window.electronAPI.closeHome();
    },
  },
};
</script>

<style scoped>
.operation {
  position: fixed;
  top: 0px;
  right: 0px;

  height: 40px;
  display: flex;
  -webkit-app-region: no-drag; /* 操作按钮区域不可拖拽，允许点击 */

  z-index: 9999;

  background-color: #fcfcfc;

  border-bottom: #ccc solid 1px;
}

.bar-button {
  width: 48px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
.bar-button-close {
  width: 48px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
.bar-button:hover {
  background-color: #f0f0f0;
}
.bar-button-close:hover {
  background-color: #e94551;
}

.bar-img {
  width: 20px;
  height: 20px;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
}
</style>
