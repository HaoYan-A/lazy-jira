import { app, BrowserWindow, session } from 'electron';
import * as path from 'path';

// 存储认证信息的变量
let authToken: string | null = null;

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    // 在生产环境中使用 file:// 协议加载
    mainWindow.loadFile(path.join(__dirname, `../renderer/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // 设置代理
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (authToken) {
      details.requestHeaders['Authorization'] = `Basic ${authToken}`;
    }
    callback({ requestHeaders: details.requestHeaders });
  });

  // 设置代理规则
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const url = details.url;
    // 处理所有 Jira 相关的请求
    if (url.startsWith('https://jira.logisticsteam.com')) {
      callback({
        redirectURL: url.replace('https://jira.logisticsteam.com', 'http://localhost:3000')
      });
    } else {
      callback({});
    }
  });

  // 监听来自渲染进程的消息
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (details.url.includes('/api/rest/auth/1/session')) {
      const authHeader = details.requestHeaders['Authorization'];
      if (authHeader) {
        authToken = authHeader.split(' ')[1];
      }
    }
    callback({ requestHeaders: details.requestHeaders });
  });

  createWindow();

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
