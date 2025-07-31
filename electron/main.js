// main.js
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

let welcomeWindow = null;
let homeWindow = null;

function createWelcomeWindow() {
  welcomeWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    maximizable: false,
    frame: false, // 无边框窗口
    icon: path.join(__dirname, 'assets', 'Logo.ico'),
    webPreferences: {
      webSecurity: false,  // 关闭安全策略，允许跨域
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  welcomeWindow.loadURL("http://localhost:5173/#/"); // Welcome.vue 路由
}

function createHomeWindow() {
  homeWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: true,
    maximizable: true,
    minimizable: true,
    frame: false,
    icon: path.join(__dirname, 'assets', 'Logo.ico'),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  homeWindow.loadURL("http://localhost:5173/#/home");
}

app.whenReady().then(() => {
  createWelcomeWindow();
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
    console.log("调用GoHOme");
  });

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWelcomeWindow();
  });
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Access-Control-Allow-Origin': ['*'],  // 或者指定你的地址
      }
    })
  })
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
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
      setting:{}
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
  console.log("read-directory: ", dirPath);
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
  console.log("dirPath: ", dirPath);

  return readDir(dirPath);
});

// 监听文件夹变化，从而刷新文件夹
// main.js (Electron 主进程)

const chokidar = require("chokidar");

let watcher;

ipcMain.handle("startWatch", async (event, dirPath) => {
  console.log("开始监听");
  if (watcher) {
    watcher.close();
  }

  watcher = chokidar.watch(dirPath, { ignoreInitial: true });

  watcher.on("all", (eventName, changedPath) => {
    console.log("文件系统变动:", eventName, changedPath);
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
    if(filePath.split('.').pop() == 'pdf'){
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
      console.log("创建2: ", folderPath + 1);
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
          fullPath = path.join(parentPath, filename.split(".")[0] + i + ".mindmap");
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
ipcMain.handle('setting-read', async () => {
  const config = readConfig();
  return config.setting || {};
});

// 监听渲染进程请求写入设置，参数是新的 setting 对象
ipcMain.handle('setting-write', async (event, newSetting) => {
  const config = readConfig();
  config.setting = JSON.parse(newSetting);  // 更新 setting 字段
  writeConfig(config);
  return { success: true };
});

const axios = require('axios')

ipcMain.handle('ai-chat-request', async (event, payload) => {
  console.log("AIAIAIAIAI: ",payload.payload);
  const res = await axios.post(
    'https://spark-api-open.xf-yun.com/v1/chat/completions',
    payload.payload.data,
    {
      headers: {
        Authorization: `Bearer ${payload.payload.token}`,
        'Content-Type': 'application/json',
      },
    }
  )
  return res.data
})