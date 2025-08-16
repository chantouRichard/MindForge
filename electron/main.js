// main.js
const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  globalShortcut,
  session,
  screen,
} = require("electron");
const path = require("path");
const fs = require("fs");
const express = require("express");

let welcomeWindow = null;
let homeWindow = null;
let petWindow = null;

const NODE_ENV = process.env.NODE_ENV;
const isDev = !app.isPackaged;

const startLocalServer = () => {
  const app = express();
  const PORT = 3000; // 可以自定义端口

  // 提供 /pdfjs 路径下的静态文件
  app.use("/pdfjs", express.static(path.join(__dirname, "../public/pdfjs")));

  // 提供 PDF 文件接口
  app.get("/pdf", (req, res) => {
    const filePath = req.query.path; // 文件绝对路径
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).send("File not found");
    }
    res.sendFile(filePath);
  });

  app.listen(PORT, () => {
    console.log(`Local PDF server running at http://localhost:${PORT}`);
  });
};

startLocalServer();

function createWelcomeWindow() {
  welcomeWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    maximizable: false,
    frame: false, // 无边框窗口
    icon: path.join(__dirname, "assets", "Logo.ico"),
    webPreferences: {
      webSecurity: false, // 关闭安全策略，允许跨域
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });

  if (NODE_ENV === "development") {
    welcomeWindow.loadURL("http://localhost:5173/#/");
  } else {
    welcomeWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
      hash: "/",
    });
  }
}

function createHomeWindow() {
  homeWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: true,
    maximizable: true,
    minimizable: true,
    frame: false,
    icon: path.join(__dirname, "assets", "Logo.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });

  if (NODE_ENV === "development") {
    homeWindow.loadURL("http://localhost:5173/#/home");
  } else {
    homeWindow.loadFile(path.join(__dirname, "./dist/index.html"), {
      hash: "/home",
    });
  }
  if (petWindow == null) {
    createPetWindow();
  }
}

function createPetWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } =
    primaryDisplay.workAreaSize;

  petWindow = new BrowserWindow({
    x: screenWidth - 600,
    y: 100,
    width: 560,
    height: 496,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: false,
      // devTools: false,
    },
  });

  if (NODE_ENV === "development") {
    petWindow.loadURL("http://localhost:5173/#/inspiration");
  } else {
    petWindow.loadFile(path.join(__dirname, "./dist/index.html"), {
      hash: "/inspiration",
    });
  }

  petWindow.on("show", () => {
    petWindow.webContents.send("window-show");
  });
}

function togglePetWindow() {
  try {
    if (petWindow) {
      if (petWindow.isVisible()) {
        petWindow.hide();
      } else {
        petWindow.show();
      }
    } else {
      createPetWindow();
    }
  } catch (error) {
    // console.warn("togglePetWindow error:", error);
    createPetWindow();
  }
}

function registerGlobalShortcut() {
  const shortcut = "CommandOrControl+L";
  const success = globalShortcut.register(shortcut, togglePetWindow);

  if (!success) {
    console.warn("快捷键注册失败:", shortcut);
  } else {
    console.log("注册快捷键:", shortcut);
  }
}

app.whenReady().then(() => {
  createWelcomeWindow();
  registerGlobalShortcut();
  ipcMain.on("minimize-welcome", () => {
    if (welcomeWindow) welcomeWindow.minimize();
  });

  ipcMain.on("close-welcome", () => {
    if (welcomeWindow) {
      welcomeWindow.close();
      welcomeWindow = null;
    }
  });

  ipcMain.on("minimize-home", () => {
    if (homeWindow) homeWindow.minimize();
  });

  ipcMain.on("maximize-home", () => {
    if (homeWindow) homeWindow.maximize();
  });

  ipcMain.on("unmaximize-home", () => {
    if (homeWindow) homeWindow.unmaximize();
  });

  ipcMain.on("close-home", () => {
    if (homeWindow) {
      homeWindow.close();
      homeWindow = null;
    }
    if (welcomeWindow) {
      welcomeWindow.close();
      welcomeWindow = null;
    }
  });

  ipcMain.on("go-to-home", () => {
    if (welcomeWindow) {
      welcomeWindow.close();
      welcomeWindow = null;
      createHomeWindow();
    }
  });

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWelcomeWindow();
  });
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Access-Control-Allow-Origin": ["*"], // 或者指定你的地址
      },
    });
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
ipcMain.handle("dialog:openDirectory", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  return result.filePaths[0]; // 返回所选路径
});

ipcMain.handle(
  "create-repository",
  async (event, { repositoryPath, repositoryName }) => {
    const fullPath = path.join(repositoryPath, repositoryName);

    if (fs.existsSync(fullPath)) {
      throw new Error("该仓库已存在，请选择其他名称或位置");
    }

    fs.mkdirSync(fullPath);
    fs.mkdirSync(path.join(fullPath, ".mindforge"));
    fs.writeFileSync(path.join(fullPath, "README.md"), `# ${repositoryName}`);

    return fullPath;
  }
);

// 仓库配置存储
const configFilePath = path.join(app.getPath("userData"), "recent_repos.json");

function readConfig() {
  if (!fs.existsSync(configFilePath)) {
    return {
      recentRepositories: [],
      lastFilePath: "",
      expandedPaths: [],
      setting: {},
    };
  }
  try {
    const content = fs.readFileSync(configFilePath, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    console.error("读取配置文件失败:", e);
    return {
      recentRepositories: [],
      lastFilePath: "",
      expandedPaths: [],
      lastOpenTime: new Date().toISOString(),
    };
  }
}

function writeConfig(data) {
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("写入配置文件失败:", e);
  }
}

ipcMain.handle("get-repositories", () => {
  const data = readConfig();
  return data.recentRepositories;
});

ipcMain.handle("add-repository", (event, repo) => {
  const data = readConfig();
  const path = repo.path;

  // 删除已有的同路径项（不重复）
  data.recentRepositories = data.recentRepositories.filter(
    (r) => r.path !== path
  );

  // 添加到最前面
  data.recentRepositories.unshift(repo);

  // 保持最多10条
  if (data.recentRepositories.length > 10) {
    data.recentRepositories = data.recentRepositories.slice(0, 10);
  }

  writeConfig(data);
  return data.recentRepositories;
});

ipcMain.handle("remove-repository", (event, repoPath) => {
  const data = readConfig();
  data.recentRepositories = data.recentRepositories.filter(
    (p) => p !== repoPath
  );
  writeConfig(data);
  return data.recentRepositories;
});

// 文件递归树
ipcMain.handle("read-directory", async (event, dirPath) => {
  const readDir = (dir) => {
    const items = fs.readdirSync(dir);
    return items.map((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      return {
        name: item,
        path: fullPath,
        type: stat.isDirectory() ? "directory" : "file",
        children: stat.isDirectory() ? readDir(fullPath) : null,
      };
    });
  };

  return readDir(dirPath);
});

// 监听文件夹变化，从而刷新文件夹
// main.js (Electron 主进程)

const chokidar = require("chokidar");

let watcher;

ipcMain.handle("startWatch", async (event, dirPath) => {
  if (watcher) {
    watcher.close();
  }

  watcher = chokidar.watch(dirPath, { ignoreInitial: true });

  watcher.on("all", (eventName, changedPath) => {
    event.sender.send("fs-changed", dirPath);
  });
});

// 读取文件内容
const readline = require("readline");

ipcMain.handle("read-file-title", async (event, filePath) => {
  try {
    // const fileName = path.basename(filePath); // 取文件名，含扩展名
    const fileName = path.basename(filePath, path.extname(filePath));

    return { success: true, title: fileName };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("read-file-content", async (event, filePath) => {
  try {
    if (filePath.split(".").pop() == "pdf") {
      const buffer = await fs.promises.readFile(filePath); // 不加编码
      const base64 = buffer.toString("base64");
      return { success: true, base64 };
    }
    const content = await fs.promises.readFile(filePath, "utf-8");
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 保存文件
ipcMain.handle("save-file-content", async (event, { filePath, content }) => {
  try {
    await fs.promises.writeFile(filePath, content, "utf-8");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
// 保存文件标题
ipcMain.handle("rename-file", async (event, { oldPath, newName }) => {
  try {
    const dir = path.dirname(oldPath);
    const ext = path.extname(oldPath);
    const newPath = path.join(
      dir,
      newName.endsWith(ext) ? newName : newName + ext
    );

    await fs.promises.rename(oldPath, newPath);

    return { success: true, newPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
// 重命名文件夹
ipcMain.handle("rename-folder", async (event, { oldPath, newName }) => {
  try {
    const parentDir = path.dirname(oldPath);
    const newPath = path.join(parentDir, newName);

    await fs.promises.rename(oldPath, newPath);

    return { success: true, newPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 存储最后打开的文件和文件展开情况
ipcMain.handle("save-last-file-path", (event, path) => {
  const data = readConfig();
  data.lastFilePath = path;
  writeConfig(data);
  return true;
});

ipcMain.handle("get-last-file-path", (event) => {
  const data = readConfig();
  return data.lastFilePath || "";
});

ipcMain.handle("save-expanded-paths", (event, pathsSet) => {
  const data = readConfig();
  // pathsSet 是 Set，先转成数组
  if (pathsSet instanceof Array) {
    // 直接传过来了数组，也兼容
    data.expandedPaths = pathsSet;
  } else if (pathsSet instanceof Set) {
    data.expandedPaths = Array.from(pathsSet);
  } else {
    // 防止不正确类型
    data.expandedPaths = [];
  }
  writeConfig(data);
  return true;
});

ipcMain.handle("get-expanded-paths", (event) => {
  const data = readConfig();
  return data.expandedPaths || [];
});

// 存储上次打开的时间
ipcMain.handle("save-last-open-time", (event, time) => {
  const data = readConfig();
  data.lastOpenTime = time;
  writeConfig(data);
  return true;
});
ipcMain.handle("get-last-open-time", (event) => {
  const data = readConfig();
  return data.lastOpenTime || "";
});

// 新建文件
ipcMain.handle("create-file", async (event, { parentPath, filename }) => {
  try {
    let fullPath = path.join(parentPath, filename);

    // 避免覆盖已有文件
    if (!fs.existsSync(fullPath)) {
      await fs.promises.writeFile(fullPath, "# 新建文件", "utf-8");
    } else {
      for (let i = 1; ; i++) {
        fullPath = path.join(parentPath, filename.split(".")[0] + i + ".md");
        if (!fs.existsSync(fullPath)) {
          await fs.promises.writeFile(fullPath, "# 新建文件", "utf-8");
          break;
        }
      }
    }

    return { success: true, path: fullPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// === 1. 创建文件夹 ===
ipcMain.handle("create-folder", async (event, options) => {
  try {
    let folderPath = path.join(options.basePath, options.folderName);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      return { success: true, message: "文件夹创建成功", path: folderPath };
    } else {
      for (let i = 1; ; i++) {
        if (!fs.existsSync(folderPath + i)) {
          folderPath = path.join(options.basePath, options.folderName + i);
          fs.mkdirSync(folderPath, { recursive: true });
          break;
        }
      }
      return { success: true, message: "文件夹创建成功", path: folderPath };
    }
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// === 2. 删除文件 ===
ipcMain.handle("delete-file", async (event, filePath) => {
  try {
    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
      fs.unlinkSync(filePath);
      return { success: true, message: "文件删除成功" };
    } else {
      return { success: false, message: "文件不存在或不是文件" };
    }
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// === 3. 删除文件夹 ===
ipcMain.handle("delete-folder", async (event, folderPath) => {
  try {
    if (fs.existsSync(folderPath) && fs.lstatSync(folderPath).isDirectory()) {
      fs.rmSync(folderPath, { recursive: true, force: true });
      return { success: true, message: "文件夹删除成功" };
    } else {
      return { success: false, message: "文件夹不存在或不是文件夹" };
    }
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// 监听图片读取请求
ipcMain.handle("load-local-image", async (event, imagePath) => {
  try {
    const data = fs.readFileSync(imagePath);
    const base64 = data.toString("base64");
    const ext = path.extname(imagePath).slice(1); // jpg, png
    return `data:image/${ext};base64,${base64}`;
  } catch (err) {
    console.error("读取图片失败：", err);
    return null;
  }
});

// 新建思维导图
ipcMain.handle("create-mindmap", async (event, { parentPath, filename }) => {
  try {
    let fullPath = path.join(parentPath, filename);

    // 避免覆盖已有文件
    if (!fs.existsSync(fullPath)) {
      await fs.promises.writeFile(fullPath, "", "utf-8");
    } else {
      for (let i = 1; ; i++) {
        fullPath = path.join(
          parentPath,
          filename.split(".")[0] + i + ".mindmap"
        );
        if (!fs.existsSync(fullPath)) {
          await fs.promises.writeFile(fullPath, "", "utf-8");
          break;
        }
      }
    }

    return { success: true, path: fullPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 监听渲染进程请求读取设置
ipcMain.handle("setting-read", async () => {
  const config = readConfig();
  return config.setting || {};
});

// 监听渲染进程请求写入设置，参数是新的 setting 对象
ipcMain.handle("setting-write", async (event, newSetting) => {
  const config = readConfig();
  config.setting = JSON.parse(newSetting); // 更新 setting 字段
  writeConfig(config);
  return { success: true };
});

const axios = require("axios");

ipcMain.handle("ai-chat-request", async (event, payload) => {
  const res = await axios.post(
    "https://spark-api-open.xf-yun.com/v1/chat/completions",
    payload.payload.data,
    {
      headers: {
        Authorization: `Bearer ${payload.payload.token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
});

// 灵感库
ipcMain.handle("new-inspiration", async (event, filePath, content) => {
  try {
    // 检查目录是否存在，不存在就创建
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content, "utf-8");
    return { success: true, message: "文件创建成功" };
  } catch (error) {
    console.error("[new-inspiration] 错误:", error);
    return { success: false, message: "创建失败", error: error.message };
  }
});

// 核心逻辑：保存灵感
ipcMain.handle("save-inspiration", async (event, { path, saveContent }) => {
  try {
    const json = JSON.parse(fs.readFileSync(path, "utf-8"));
    const { tag, inspiration } = saveContent;

    let group = json.inspirations.find((item) => item.tag === tag);
    if (group) {
      group.inspirations.push(inspiration);
    } else {
      json.inspirations.push({
        tag,
        inspirations: [inspiration],
      });
    }

    fs.writeFileSync(path, JSON.stringify(json, null, 2));
    return { success: true };
  } catch (err) {
    console.error("保存失败:", err);
    return { success: false, error: err.message };
  }
});

// 隐藏灵感库
ipcMain.handle("hide-inspiration", async (event) => {
  if (petWindow) {
    petWindow.hide();
  }
});

// 计划管理
ipcMain.handle("new-schedule", async (event, filePath, content) => {
  try {
    // 检查目录是否存在，不存在就创建
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content, "utf-8");
    return { success: true, message: "文件创建成功" };
  } catch (error) {
    console.error("[new-inspiration] 错误:", error);
    return { success: false, message: "创建失败", error: error.message };
  }
});

// 核心逻辑：保存日计划
ipcMain.handle("save-schedule", async (event, { path, saveContent }) => {
  try {
    const json = JSON.parse(fs.readFileSync(path, "utf-8"));
    const newSchedules = JSON.parse(saveContent).schedules;

    if (!json.schedules) {
      // 文件内没有 schedules，直接赋值
      json.schedules = newSchedules;
    } else {
      // 文件已有 schedules，更新或新增
      newSchedules.forEach((newEvent) => {
        const idx = json.schedules.findIndex((ev) => ev.id === newEvent.id);
        if (idx !== -1) {
          // 更新已有事件
          json.schedules[idx] = newEvent;
        } else {
          // 新增事件
          json.schedules.push(newEvent);
        }
      });
    }

    fs.writeFileSync(path, JSON.stringify(json, null, 2));
    return { success: true };
  } catch (err) {
    console.error("保存失败:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("save-week-schedule", async (event, { path, saveContent }) => {
  try {
    const json = JSON.parse(fs.readFileSync(path, "utf-8"));
    const { data: newData, links: newLinks } =
      JSON.parse(saveContent).WeekSchedules;

    if (!json.WeekSchedules) {
      json.WeekSchedules = { data: [], links: [] };
    }

    // ===== 处理 data =====
    newData.forEach((newEvent) => {
      const idx = json.WeekSchedules.data.findIndex(
        (ev) => ev.id === newEvent.id
      );
      if (idx !== -1) {
        json.WeekSchedules.data[idx] = newEvent; // 更新
      } else {
        json.WeekSchedules.data.push(newEvent); // 新增
      }
    });

    // ===== 处理 links =====
    newLinks.forEach((newLink) => {
      const idx = json.WeekSchedules.links.findIndex(
        (link) =>
          link.source === newLink.source && link.target === newLink.target
      );
      if (idx !== -1) {
        json.WeekSchedules.links[idx] = newLink; // 更新
      } else {
        json.WeekSchedules.links.push(newLink); // 新增
      }
    });

    fs.writeFileSync(path, JSON.stringify(json, null, 2));
    return { success: true };
  } catch (err) {
    console.error("保存失败:", err);
    return { success: false, error: err.message };
  }
});

// 年计划
ipcMain.handle("save-year-schedule", async (event, { path, saveContent }) => {
  try {
    const json = JSON.parse(fs.readFileSync(path, "utf-8"));
    const { data: newData, links: newLinks } =
      JSON.parse(saveContent).YearSchedules;

    if (!json.YearSchedules) {
      json.YearSchedules = { data: [], links: [] };
    }

    // ===== 处理 data =====
    newData.forEach((newEvent) => {
      const idx = json.YearSchedules.data.findIndex(
        (ev) => ev.id === newEvent.id
      );
      if (idx !== -1) {
        json.YearSchedules.data[idx] = newEvent; // 更新
      } else {
        json.YearSchedules.data.push(newEvent); // 新增
      }
    });

    // ===== 处理 links =====
    newLinks.forEach((newLink) => {
      const idx = json.YearSchedules.links.findIndex(
        (link) =>
          link.source === newLink.source && link.target === newLink.target
      );
      if (idx !== -1) {
        json.YearSchedules.links[idx] = newLink; // 更新
      } else {
        json.YearSchedules.links.push(newLink); // 新增
      }
    });

    fs.writeFileSync(path, JSON.stringify(json, null, 2));
    return { success: true };
  } catch (err) {
    console.error("保存失败:", err);
    return { success: false, error: err.message };
  }
});

// 进度管理
ipcMain.handle("new-progress", async (event, filePath, content) => {
  try {
    // 检查目录是否存在，不存在就创建
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content, "utf-8");
    return { success: true, message: "文件创建成功" };
  } catch (error) {
    console.error("[new-progress] 错误:", error);
    return { success: false, message: "创建失败", error: error.message };
  }
});

// 核心逻辑：保存进度
ipcMain.handle("save-progress", async (event, { path, saveContent }) => {
  try {
    const json = JSON.parse(fs.readFileSync(path, "utf-8"));
    const newProgresses = JSON.parse(saveContent).progresses || [];

    // 如果 progress 不存在，先初始化为数组
    if (!Array.isArray(json.progresses)) {
      json.progresses = [];
    }

    // 遍历新数据，按 id 更新或新增
    newProgresses.forEach((newItem) => {
      const idx = json.progresses.findIndex(
        (oldItem) => oldItem.id === newItem.id
      );
      if (idx !== -1) {
        json.progresses[idx] = newItem; // 更新
      } else {
        json.progresses.push(newItem); // 新增
      }
    });

    fs.writeFileSync(path, JSON.stringify(json, null, 2), "utf-8");

    return { success: true };
  } catch (err) {
    console.error("保存失败:", err);
    return { success: false, error: err.message };
  }
});

// 删除进度
ipcMain.handle("delete-progress", async (event, { path, outerId, innerId }) => {
  try {
    const json = JSON.parse(fs.readFileSync(path, "utf-8"));

    if (!Array.isArray(json.progresses)) {
      json.progresses = [];
    }

    if (!innerId) {
      // 删除外层
      json.progresses = json.progresses.filter((p) => p.id !== outerId);
    } else {
      // 删除内层
      const outer = json.progresses.find((p) => p.id === outerId);
      if (outer && Array.isArray(outer.progresses)) {
        outer.progresses = outer.progresses.filter((ip) => ip.id !== innerId);
      }
    }

    fs.writeFileSync(path, JSON.stringify(json, null, 2), "utf-8");

    return { success: true };
  } catch (err) {
    console.error("删除失败:", err);
    return { success: false, error: err.message };
  }
});

// 影记管理
ipcMain.handle("new-anno", async (event, filePath, content) => {
  try {
    // 检查目录是否存在，不存在就创建
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content, "utf-8");
    return { success: true, message: "文件创建成功" };
  } catch (error) {
    console.error("[new-progress] 错误:", error);
    return { success: false, message: "创建失败", error: error.message };
  }
});

// 核心逻辑：保存影记
ipcMain.handle("save-anno", async (event, { path, saveContent }) => {
  try {
    const json = JSON.parse(fs.readFileSync(path, "utf-8"));
    const newAnnoData = JSON.parse(saveContent).albums || [];

    if (!Array.isArray(json.albums)) json.albums = [];

    newAnnoData.forEach((newAlbum) => {
      if (!Array.isArray(newAlbum.memories)) newAlbum.memories = [];

      let albumIdx = json.albums.findIndex(
        (a) => a.albumId === newAlbum.albumId
      );

      if (albumIdx === -1) {
        // 新相册直接 push
        json.albums.push(newAlbum);
      } else {
        // 老相册，处理 memories
        const oldAlbum = json.albums[albumIdx];
        json.albums[albumIdx] = {
          ...oldAlbum,
          ...newAlbum, // 会更新 albumTitle、type、urgency 等字段
          memories: oldAlbum.memories || [], // 保留老的 memories，下面再处理
        };

        newAlbum.memories.forEach((newMemory) => {
          let memIdx = json.albums[albumIdx].memories.findIndex(
            (m) => m.memoryId === newMemory.memoryId
          );

          if (memIdx === -1) {
            // 新 memory
            json.albums[albumIdx].memories.push(newMemory);
          } else {
            // 更新 images 和 texts
            json.albums[albumIdx].memories[memIdx] = {
              ...json.albums[albumIdx].memories[memIdx],
              memoryTitle: newMemory.memoryTitle,
              thumbnail: newMemory.thumbnail,
              images: newMemory.images,
              texts: newMemory.texts,
            };
          }
        });
      }
    });

    fs.writeFileSync(path, JSON.stringify(json, null, 2), "utf-8");
    return { success: true };
  } catch (err) {
    console.error("保存注释失败:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("save-anno-image", async (event, { memoryId, id, src }) => {
  try {
    if (typeof src !== "string") throw new Error("src 必须是字符串");

    // 安全存储目录
    const baseDir = path.join(__dirname, ".mindforge", "anno-images");
    const memoryDir = path.join(baseDir, String(memoryId));
    fs.mkdirSync(memoryDir, { recursive: true });

    // 判断类型和扩展名
    let ext = "png"; // 默认
    if (src.startsWith("data:image/")) {
      const match = src.match(/^data:image\/(.*?);base64,/);
      if (match && match[1]) ext = match[1].toLowerCase();
      if (ext === "jpeg") ext = "jpg";
    } else if (src.startsWith("file://")) {
      const parsedPath = path.parse(src.replace("file://", ""));
      ext = parsedPath.ext.replace(".", "").toLowerCase();
      if (ext === "jpeg") ext = "jpg";
      if (!["png", "jpg", "svg"].includes(ext)) ext = "png"; // 不支持格式默认 png
    } else {
      throw new Error("不支持的 src 格式");
    }

    const filePath = path.join(memoryDir, `${id}.${ext}`);

    // 写入文件
    if (ext === "svg") {
      // SVG 可以直接写文本
      let svgContent;
      if (src.startsWith("data:image/svg+xml")) {
        svgContent = Buffer.from(src.split(",")[1], "base64");
      } else if (src.startsWith("file://")) {
        svgContent = fs.readFileSync(src.replace("file://", ""));
      } else {
        throw new Error("SVG 格式不支持的 src");
      }
      fs.writeFileSync(filePath, svgContent);
    } else {
      // 图片格式
      let imageBuffer;
      if (src.startsWith("data:image")) {
        const base64Data = src.split(",")[1];
        imageBuffer = Buffer.from(base64Data, "base64");
      } else if (src.startsWith("file://")) {
        imageBuffer = fs.readFileSync(src.replace("file://", ""));
      } else {
        throw new Error("不支持的 src 格式");
      }
      fs.writeFileSync(filePath, imageBuffer);
    }

    // 返回 Base64 给前端
    const savedBuffer = fs.readFileSync(filePath);
    const base64 =
      ext === "svg"
        ? `data:image/svg+xml;base64,${savedBuffer.toString("base64")}`
        : `data:image/${ext};base64,${savedBuffer.toString("base64")}`;

    return { success: true, base64, filePath };
  } catch (err) {
    console.error("保存图片失败:", err);
    return { success: false, error: err.message };
  }
});

/**
 * 读取图片
 * 参数: { memoryId, id }
 * 返回: Base64
 */
ipcMain.handle("read-anno-image", async (event, { memoryId, id }) => {
  try {
    const baseDir = path.join(__dirname, ".mindforge", "anno-images", memoryId);

    // 支持的扩展名列表
    const exts = ["png", "jpg", "jpeg", "svg", "svg+xml"];
    let foundFile = null;
    let ext = "";

    for (const e of exts) {
      const filePath = path.join(baseDir, `${id}.${e}`);
      if (fs.existsSync(filePath)) {
        foundFile = filePath;
        ext = e === "jpeg" ? "jpg" : e; // 统一 jpeg -> jpg
        break;
      }
    }

    if (!foundFile) throw new Error("图片不存在");

    const buffer = fs.readFileSync(foundFile);

    // 根据扩展名生成 Base64 MIME
    const mimeType =
      ext === "svg" || ext === "svg+xml" ? "image/svg+xml" : `image/${ext}`;
    const base64 = `data:${mimeType};base64,${buffer.toString("base64")}`;

    return { success: true, base64, filePath: foundFile };
  } catch (err) {
    console.error("读取图片失败:", err);
    return { success: false, error: err.message };
  }
});

// 删除影记
ipcMain.handle(
  "delete-album-memory",
  async (event, { path, albumId, memoryId }) => {
    try {
      const json = JSON.parse(fs.readFileSync(path, "utf-8"));
      if (!Array.isArray(json.albums)) json.albums = [];

      const albumIndex = json.albums.findIndex((a) => a.albumId === albumId);
      if (albumIndex === -1) {
        return { success: false, error: "Album not found" };
      }

      if (memoryId == null) {
        // 删除整个 album
        json.albums.splice(albumIndex, 1);
      } else {
        const memoryIndex = json.albums[albumIndex].memories.findIndex(
          (m) => m.memoryId === memoryId
        );
        if (memoryIndex === -1) {
          return { success: false, error: "Memory not found" };
        }
        json.albums[albumIndex].memories.splice(memoryIndex, 1);
      }

      fs.writeFileSync(path, JSON.stringify(json, null, 2), "utf-8");
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
);
