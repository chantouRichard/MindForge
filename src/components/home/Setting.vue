<template>
  <div class="overlay" @click.self="closeSetting">
    <div class="setting-panel">
      <div class="header">
        <h2>设置</h2>
        <div class="close-btn" @click="closeSetting">
          <img src="../../assets/home/close.png" />
        </div>
      </div>
      <div class="body">
        <div class="sidebar">
          <div
            v-for="(item, index) in menu"
            :key="index"
            class="menu-item"
            :class="{ active: activeMenu === item.key }"
            @click="activeMenu = item.key"
          >
            {{ item.title }}
          </div>
        </div>
        <div class="content">
          <!-- AI 配置 -->
          <div v-if="activeMenu === 'ai'">
            <div class="setting-item">
              <div class="item-title">API 密码</div>
              <div class="item-content">
                <input v-model="data.aiConfig.apiPassword" />
              </div>
            </div>
            <div class="setting-item">
              <div class="item-title">模型名称</div>
              <div class="item-content">
                <input v-model="data.aiConfig.model" />
              </div>
            </div>
            <div class="setting-item">
              <div class="item-title">Temperature</div>
              <div class="item-content">
                <input type="number" step="0.1" min="0" max="1" v-model="data.aiConfig.temperature" />
              </div>
            </div>
          </div>

          <!-- 外观配置 -->
          <div v-if="activeMenu === 'appearance'">
            <div class="setting-item">
              <div class="item-title">主题</div>
              <div class="item-content">
                <select v-model="data.appearanceConfig.theme">
                  <option value="light">浅色</option>
                  <option value="dark">深色</option>
                </select>
              </div>
            </div>
            <div class="setting-item">
              <div class="item-title">字体大小</div>
              <div class="item-content">
                <input type="number" v-model="data.appearanceConfig.fontSize" />
              </div>
            </div>
            <div class="setting-item">
              <div class="item-title">显示行号</div>
              <div class="item-content">
                <input type="checkbox" v-model="data.appearanceConfig.showLineNumbers" />
              </div>
            </div>
          </div>

          <!-- 编辑器配置 -->
          <div v-if="activeMenu === 'editor'">
            <div class="setting-item">
              <div class="item-title">自动保存</div>
              <div class="item-content">
                <input type="checkbox" v-model="data.editorConfig.autoSave" />
              </div>
            </div>
            <div class="setting-item">
              <div class="item-title">缩进大小</div>
              <div class="item-content">
                <input type="number" v-model="data.editorConfig.tabSize" />
              </div>
            </div>
            <div class="setting-item">
              <div class="item-title">默认语言</div>
              <div class="item-content">
                <input v-model="data.editorConfig.language" />
              </div>
            </div>
          </div>

          <!-- 用户信息 -->
          <div v-if="activeMenu === 'user'">
            <div class="setting-item">
              <div class="item-title">用户名</div>
              <div class="item-content">
                <input v-model="data.userConfig.userName" />
              </div>
            </div>
            <div class="setting-item">
              <div class="item-title">邮箱</div>
              <div class="item-content">
                <input v-model="data.userConfig.email" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="footer">
        <div class="footer-btn" @click="applySettings">应用</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSettingStore } from '../../store/setting'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['close'])
const closeSetting = () => emit('close')

const settingStore = useSettingStore()

const activeMenu = ref('ai') // 默认显示 AI 设置

const menu = [
  { key: 'ai', title: 'AI 配置' },
  { key: 'appearance', title: '外观设置' },
  { key: 'editor', title: '编辑器设置' },
  { key: 'user', title: '用户信息' },
]

const data = ref({
      aiConfig: {
        apiPassword: "", // AI 密码或 Token
        model: "", // AI 模型名，如 gpt-4、spark 等
        temperature: 0.7, // 可控性参数
      },
      appearanceConfig: {
        theme: "light", // 主题：light / dark
        fontSize: 14, // 字体大小
        showLineNumbers: true, // 是否显示行号
      },
      editorConfig: {
        autoSave: true, // 是否自动保存
        tabSize: 2, // 缩进大小
        language: "markdown", // 默认语言
      },
      userConfig: {
        userName: "",
        email: "",
      },
    });

onMounted(async () => {
  const result = await window.electronAPI.settingRead();
  data.value = JSON.parse(result);

  console.log("data.value: ",data.value);
  settingStore.setData(data.value);
});

const applySettings = async () => {
  settingStore.setData(data.value)

  emit('close')

  const rawData = settingStore.data
  const result = await window.electronAPI.settingWrite(JSON.stringify(rawData));

  if(result.success) {
    ElMessage.success("设置已保存");
  }
}

</script>


<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.setting-panel {
  width: 80vw;
  height: 80vh;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 16px;
  border-bottom: 1px solid #eee;
}

.close-btn {
  margin-left: auto;
  width: 24px;
  height: 24px;
  cursor: pointer;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-btn:hover {
  background-color: #e9e9e9;
}

.body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 200px;
  border-right: 1px solid #eee;
  padding: 12px;
  box-sizing: border-box;
  background: #f9f9f9;
}
.menu-item {
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 14px;
}
.menu-item.active,
.menu-item:hover {
  background-color: #e3efff;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.setting-item {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}
.item-title {
  width: 120px;
  font-size: 14px;
  color: #333;
}
.item-content input {
  width: 300px;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.footer {
  height: 48px;
  padding: 0 16px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.footer-btn {
  padding: 6px 20px;
  background-color: #619ffc;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.2s;
}
.footer-btn:hover {
  background-color: #0066ff;
}
</style>