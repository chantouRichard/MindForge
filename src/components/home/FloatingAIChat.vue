<template>
  <div>
    <!-- 悬浮球 -->
    <div class="floating-ball" @click="toggleChat">🤖</div>

    <!-- 聊天窗口 -->
    <div v-if="isOpen" class="chat-window">
      <div class="chat-header">
        <span>AI 聊天助手</span>
        <div class="close-btn" @click="toggleChat">✕</div>
      </div>

      <div class="chat-body">
        <div v-for="(msg, idx) in messages" :key="idx" :class="msg.role">
          <strong v-if="msg.role === 'user'">你：</strong>
          <strong v-else>AI：</strong>
          <span>{{ msg.content }}</span>
        </div>
      </div>

      <div class="chat-input">
        <input
          v-model="input"
          @keydown.enter="sendMessage"
          placeholder="输入内容..."
        />
        <button @click="sendMessage">发送</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";

// props: 接口 URL 从外部传入
const props = defineProps({
  apiUrl: { type: String, required: true },
});

const isOpen = ref(false);
const input = ref("");
const messages = ref([]);

const toggleChat = () => {
  isOpen.value = !isOpen.value;
};

import { useSettingStore } from "../../store/setting";
const settingStore = useSettingStore();

const sendMessage = async () => {
  messages.value.push({ role: "user", content: input.value });
  const payload = {
    data: {
      model: "lite",
      messages: [
        {
          role: "user",
          content: input.value,
        },
      ],
      stream: false,
    },
    token: settingStore.data.aiConfig.apiPassword, // 携带 token
  };
  input.value = "";

  try {
    const res = await window.electronAPI.AIChatRequest({ payload });
    console.log("AI回复内容：", res.choices[0].message.content);
    messages.value.push({
      role: "ai",
      content: res.choices[0].message.content || "AI 无响应",
    });
  } catch (e) {
    console.error(e);
    messages.value.push({ role: "ai", content: "请求失败，请稍后再试。" });
  }
};
</script>

<style scoped>
.floating-ball {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 60px;
  height: 60px;
  background-color: #4f46e5;
  border-radius: 50%;
  color: white;
  font-size: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  z-index: 999;
  transition: background-color 0.2s;
}
.floating-ball:hover {
  background-color: #4338ca;
}

.chat-window {
  position: fixed;
  bottom: 100px;
  right: 24px;
  width: 320px;
  max-height: 500px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 999;

  height: 300px;
}

.chat-header {
  background: #4f46e5;
  color: white;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: transparent;
  color: white;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.chat-body {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  font-size: 14px;
}

.chat-body .user {
  text-align: right;
  margin: 4px 0;
  color: #333;
}

.chat-body .ai {
  text-align: left;
  margin: 4px 0;
  color: #0d9488;
}

.chat-input {
  display: flex;
  border-top: 1px solid #eee;
  padding: 6px;
  gap: 6px;
}

.chat-input input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.chat-input button {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
