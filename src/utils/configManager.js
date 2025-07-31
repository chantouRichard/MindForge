// src/utils/configManager.js
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const configPath = path.join(app.getPath("userData"), "config.json");

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } else {
      return { recentRepositories: [], lastOpened: null };
    }
  } catch (e) {
    console.error("加载配置失败", e);
    return { recentRepositories: [], lastOpened: null };
  }
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function addRepository(name, repoPath) {
  const config = loadConfig();
  // 去重
  config.recentRepositories = config.recentRepositories.filter(r => r.path !== repoPath);
  config.recentRepositories.unshift({ name, path: repoPath });
  config.lastOpened = repoPath;
  saveConfig(config);
}

module.exports = {
  loadConfig,
  saveConfig,
  addRepository
};
