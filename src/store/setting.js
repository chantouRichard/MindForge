// stores/setting.js
import { defineStore } from "pinia";

function deepMerge(target, source) {
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

export const useSettingStore = defineStore("setting", {
  state: () => ({
    data: {
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
    },
  }),
  actions: {
    setData(data) {
      deepMerge(this.data, data);
    },
  },
});
