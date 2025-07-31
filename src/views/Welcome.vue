<template>
  <div class="window-bar">
    <operation />
  </div>

  <div class="content" :class="{ 'panel-active': showPanel }">
    <div class="welcome-logo"></div>
    <div class="welcome-title">Mind Forge</div>
    <button v-if="!showPanel" class="welcome-button" @click="begin">
      让我们开始吧
    </button>

    <!-- 抽屉区域 -->
    <transition name="slide-up">
      <div class="welcome-panel" :class="{ active: showPanel }">
        <div class="welcome-panel-main" :class="{ active: showCreate }">
          <div class="welcome-panel-item">
            <div class="item-left">
              <div class="item-title">新建仓库</div>
              <div class="item-description">
                在指定文件夹下创建一个新的仓库。
              </div>
            </div>
            <div
              class="item-button"
              style="background-color: #5c78cf; color: white"
              @click="createRepository"
            >
              创建
            </div>
          </div>
          <div class="welcome-panel-item">
            <div class="item-left">
              <div class="item-title">打开本地仓库</div>
              <div class="item-description">
                将一个本地文件夹作为仓库在 MindForge 中打开。
              </div>
            </div>
            <div class="item-button" @click="open">打开</div>
          </div>
          <div class="welcome-panel-item">
            <div class="item-left">
              <div class="item-title">同步远程仓库</div>
              <div class="item-description">
                将 MindForge 同步服务中的远程仓库同步到本地。
              </div>
            </div>
            <div class="item-button" @click="login">登录</div>
          </div>
        </div>
        <div class="welcome-panel-create" :class="{ active: showCreate }">
          <div
            style="
              display: flex;
              justify-content: flex-start;
              width: 100%;
              align-items: center;
            "
          >
            <img
              src="/src/assets/welcome/back.png"
              alt=""
              style="width: 24px; height: 24px"
              @click="back"
            />
            <div
              @click="back"
              style="font-family: '文悦孙小松春物语体 (须授权)'"
            >
              返回
            </div>
          </div>
          <div class="welcome-panel-item">
            <div class="item-title">创建本地仓库</div>
          </div>
          <div class="welcome-line"></div>
          <div class="welcome-panel-item">
            <div class="item-left">
              <div class="item-title">仓库名称</div>
              <div class="item-decription">给新仓库起一个好听的名字吧</div>
            </div>
            <input
              class="item-input"
              v-model="repositoryName"
              placeholder="仓库名称"
            />
          </div>
          <div class="welcome-line"></div>
          <div class="welcome-panel-item">
            <div class="item-left">
              <div class="item-title">仓库位置</div>
              <div class="item-decription" v-if="repositoryPath == ''">
                指定新仓库的存放位置
              </div>
              <div class="item-decription" v-else>
                新仓库将存放于: {{ repositoryPath }}
              </div>
            </div>
            <div class="item-button" @click="setPath">浏览</div>
          </div>

          <div
            class="item-button"
            style="background-color: #5c78cf; color: white"
            @click="completeCreate"
          >
            创建
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import operation from "../components/operation.vue";
import { ElMessage } from "element-plus";
import { useRepositoryStore } from "../store/repository";

export default {
  name: "Welcome",
  mounted() {
    // window.repositoryAPI
    //   .getRepositories()
    //   .then((repos) => {
    //     if (repos.length > 0) {
    //       // 假设取第一个仓库作为默认加载
    //       this.repositoryPath = repos[0].path;
    //       this.repositoryName = repos[0].name;

    //       const repositoryStore = useRepositoryStore();
    //       repositoryStore.recentRepositories = repos;

    //       console.log("加载仓库列表成功", repositoryStore.recentRepositories);
    //     }
    //   })
    //   .catch((err) => {
    //     console.error("加载仓库列表失败", err);
    //   });
    
  },
  data() {
    return {
      showPanel: false,
      showCreate: false,

      // 仓库信息
      repositoryName: "",
      repositoryPath: "",
    };
  },
  methods: {
    begin() {
      this.showPanel = true;
      console.log("repositoryPath: " + this.repositoryPath);
    },
    goToHome() {
      if (window.electronAPI) {
        window.electronAPI.goToHome();
      } else {
        this.$router.push("/home");
      }
    },
    // 创建仓库
    createRepository() {
      this.showCreate = true;
    },
    back() {
      this.showCreate = false;
    },
    async setPath() {
      const folderPath = await window.electronAPI.selectFolder();
      this.repositoryPath = folderPath;
    },
    async completeCreate() {
      if (!this.repositoryName || !this.repositoryPath) {
        ElMessage.warning("请填写仓库名称并选择位置");
        return;
      }

      try {
        const fullPath = await window.electronAPI.createRepository({
          repositoryPath: this.repositoryPath,
          repositoryName: this.repositoryName,
        });
        await window.repositoryAPI.addRepository({
          name: this.repositoryName,
          path: fullPath,
        });

        // 调用Pinia状态管理存储新仓库
        const repositoryStore = useRepositoryStore();
        await repositoryStore.addRepository({
          name: this.repositoryName,
          path: fullPath,
        });

        ElMessage.success("仓库创建成功！");
        this.showCreate = false;

        this.goToHome();
      } catch (err) {
        console.error("创建仓库出错:", err);
        ElMessage.error(err.message || "创建仓库失败");
      }
    },
    async open() {
      const folderPath = await window.electronAPI.selectFolder();
      this.repositoryPath = folderPath;
      this.repositoryName = folderPath.split("\\").pop();

      if (this.repositoryPath && this.repositoryName) {
        await window.repositoryAPI.addRepository({
          name: this.repositoryName,
          path: folderPath,
        });

        // 调用Pinia状态管理存储新仓库
        const repositoryStore = useRepositoryStore();
        await repositoryStore.addRepository({
          name: this.repositoryName,
          path: folderPath,
        });

        this.goToHome();
      }
    },
    login() {
      ElMessage.error("登录功能暂未开放");
    },
  },
  components: {
    operation,
  },
};
</script>

<style scoped>
.window-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 32px;
  background: #fcfcfc;
  -webkit-app-region: drag; /* 整个bar可拖拽 */
  display: flex;
  justify-content: flex-end;
}

.content {
  flex: 1; /* 填满剩余空间 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  box-sizing: border-box; /* 防止padding撑大尺寸 */
  padding: 20px; /* 如果需要 */

  user-select: none;
}

.welcome-logo {
  width: 168px;
  height: 168px;

  background-image: url("/public/Logo2.png");

  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
}

.welcome-title {
  font-size: 36px;
  font-weight: bold;
  font-family: consolas;
}

.welcome-logo,
.welcome-title {
  transition: transform 0.6s ease;
}

/* 当 panel 出现时，整体上移一些 */
.content.panel-active .welcome-logo,
.content.panel-active .welcome-title {
  transform: translateY(-160px);
}

.welcome-button {
  background-color: #ceebff;
  opacity: 1;
  transition: transform 0.6s ease;
}
.content.panel-active .welcome-button {
  opacity: 0;
}

.welcome-panel {
  height: 280px;
  width: 80%;
  background-color: #fcfcfc;
  padding: 20px;
  border-radius: 16px;
  border: #ceebff solid 2px;

  /* 初始位置隐藏在下方 */
  transform: translateY(100%);
  opacity: 0;

  /* 动画过渡 */
  transition: all 0.6s ease;

  display: flex;
  flex-direction: column;

  position: absolute;

  overflow: hidden;
}

/* 动画触发状态 */
.welcome-panel.active {
  transform: translateY(40%);
  opacity: 1;
}

.welcome-panel-main {
  width: 100%;
  height: 100%;
  gap: 20px;
  display: flex;
  flex-direction: column;

  /* 动画 */
  transition: all 0.6s ease;
  transform: translateY(0%);
  opacity: 1;
}

.welcome-panel-main.active {
  transform: translateY(-100%);
  opacity: 0;
  height: 0;
}

.welcome-panel-create {
  width: 100%;
  height: 100%;
  gap: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;

  /* 动画 */
  transition: all 0.6s ease;
  transform: translateY(100%);
  opacity: 0;
}

.welcome-panel-create.active {
  transform: translateY(0%);
  opacity: 1;
}

.welcome-line {
  width: 100%;
  border: #aeaeae solid 1px;
}

.welcome-panel-item {
  display: flex;

  justify-content: space-between;

  align-items: center;

  width: 100%;
}

.item-left {
  display: flex;
  flex-direction: column;

  justify-content: flex-start;
}

.item-title {
  font-size: 18px;
  font-weight: bold;

  text-align: left;
}

.item-decription {
  font-size: 14px;

  text-align: left;
}

.item-input {
  height: 32px;
  width: 144px;

  border: #aeaeae solid 2px;
  border-radius: 6px;
}

.item-button {
  width: 96px;
  height: 32px;
  border-radius: 6px;

  background-color: #f1f1f1;

  display: flex;
  justify-content: center;
  align-items: center;

  cursor: pointer;
}

/* 抽屉的动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100px);
  opacity: 0;
}

.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateY(0);
  opacity: 1;
}
</style>
