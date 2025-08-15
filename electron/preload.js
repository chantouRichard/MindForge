// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  minimizeWelcome: () => ipcRenderer.send("minimize-welcome"),
  closeWelcome: () => ipcRenderer.send("close-welcome"),

  minimizeHome: () => ipcRenderer.send("minimize-home"),
  maximizeHome: () => ipcRenderer.send("maximize-home"),
  unmaximizeHome: () => ipcRenderer.send("unmaximize-home"),
  closeHome: () => ipcRenderer.send("close-home"),

  goToHome: () => ipcRenderer.send("go-to-home"),

  // 浏览文件夹
  selectFolder: () => ipcRenderer.invoke("dialog:openDirectory"),
  // 创建仓库
  createRepository: (data) => ipcRenderer.invoke("create-repository", data),

  // 读取目录
  readDirectory: (path) => ipcRenderer.invoke("read-directory", path),
  startWatch: (path) => ipcRenderer.invoke("startWatch", path),
  onFsChanged: (callback) =>
    ipcRenderer.on("fs-changed", (_, path) => callback(path)),

  // 读取文件内容
  readFileTitle: (path) => ipcRenderer.invoke("read-file-title", path),
  readFileContent: (path) => ipcRenderer.invoke("read-file-content", path),

  // 保存文件
  saveFileContent: ({ filePath, content }) =>
    ipcRenderer.invoke("save-file-content", { filePath, content }),
  renameFile: ({ oldPath, newName }) =>
    ipcRenderer.invoke("rename-file", { oldPath, newName }),
  renameFolder: ({ oldPath, newName }) =>
    ipcRenderer.invoke("rename-folder", { oldPath, newName }),

  // 存储最后打开的文件
  saveLastFilePath: (path) => ipcRenderer.invoke("save-last-file-path", path),
  getLastFilePath: () => ipcRenderer.invoke("get-last-file-path"),

  // 存储文件展开情况
  saveExpandedPaths: (paths) =>
    ipcRenderer.invoke("save-expanded-paths", paths),
  getExpandedPaths: () => ipcRenderer.invoke("get-expanded-paths"),

  // 上次打开时间
  saveLastOpenTime: (time) => ipcRenderer.invoke("save-last-open-time", time),
  getLastOpenTime: () => ipcRenderer.invoke("get-last-open-time"),

  // 新建文件
  createFile: (options) => ipcRenderer.invoke("create-file", options),
  createFolder: (options) => ipcRenderer.invoke("create-folder", options),
  deleteFile: (path) => ipcRenderer.invoke("delete-file", path),
  deleteFolder: (path) => ipcRenderer.invoke("delete-folder", path),

  // 读取图片
  loadLocalImage: (imagePath) =>
    ipcRenderer.invoke("load-local-image", imagePath),

  // 新建思维导图
  createMindMap: (options) => ipcRenderer.invoke("create-mindmap", options),

  settingWrite: (newSetting) => ipcRenderer.invoke("setting-write", newSetting),
  settingRead: () => ipcRenderer.invoke("setting-read"),

  // AI 聊天
  AIChatRequest: (payload) => ipcRenderer.invoke("ai-chat-request", payload),

  // 灵感库
  newInspiration: (path, content) =>
    ipcRenderer.invoke("new-inspiration", path, content),
  saveInspiration: ({ path, saveContent }) =>
    ipcRenderer.invoke("save-inspiration", { path, saveContent }),

  // 灵感库初始化数据
  onInitData: (callback) => ipcRenderer.on('init-data', (event, data) => callback(data)),
  hideInspiration: () => ipcRenderer.invoke("hide-inspiration"),
  onWindowShow: (callback) => ipcRenderer.on('window-show', callback),

  // 计划管理
  newSchedule: (path, content) => ipcRenderer.invoke("new-schedule", path, content),
  saveSchedule: ({path, saveContent}) => ipcRenderer.invoke("save-schedule", {path, saveContent}),
  saveWeekSchedule: ({path, saveContent}) => ipcRenderer.invoke("save-week-schedule", {path, saveContent}),
  saveYearSchedule: ({path, saveContent}) => ipcRenderer.invoke("save-year-schedule", {path, saveContent}),

  // 进度管理
  newProgress: (path, content) => ipcRenderer.invoke("new-progress", path, content),
  saveProgress: ({path, saveContent}) => ipcRenderer.invoke("save-progress", {path, saveContent}),
  deleteProgress: (params) => ipcRenderer.invoke("delete-progress", params),

  // 影记管理
  newAnno: (path, content) => ipcRenderer.invoke("new-anno", path, content),
  saveAnno: ({path, saveContent}) => ipcRenderer.invoke("save-anno", {path, saveContent}),
  saveAnnoImage: ({memoryId, id, src}) => ipcRenderer.invoke("save-anno-image", { memoryId, id, src }),
  readAnnoImage: ({memoryId, id}) => ipcRenderer.invoke("read-anno-image", { memoryId, id }),
  deleteAlbumOrMemory: ({path, albumId, memoryId}) =>
    ipcRenderer.invoke("delete-album-memory", { path, albumId, memoryId })
});

// 仓库管理
contextBridge.exposeInMainWorld("repositoryAPI", {
  getRepositories: () => ipcRenderer.invoke("get-repositories"),
  addRepository: (path) => ipcRenderer.invoke("add-repository", path),
  removeRepository: (path) => ipcRenderer.invoke("remove-repository", path),
});
