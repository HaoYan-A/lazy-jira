import { app, BrowserWindow, session, ipcMain } from 'electron';
import * as path from 'path';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

// 存储认证信息的变量
let authToken: string | null = null;
let proxyServer: any = null;

const startProxyServer = () => {
  const app = express();

  // 代理配置
  const proxyOptions = {
    target: 'https://jira.logisticsteam.com',
    changeOrigin: true,
    secure: false,
    onProxyReq: (proxyReq: any, req: any, res: any) => {
      // 只保留必要的请求头
      proxyReq.setHeader('Accept', '*/*');
    },
    onProxyRes: (proxyRes: any, req: any, res: any) => {
      // 处理响应头
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    }
  };

  // 设置代理 - 代理所有请求
  app.use('/', createProxyMiddleware(proxyOptions));

  // 启动服务器
  const PORT = 3000;
  proxyServer = app.listen(PORT, () => {
    console.log(`Proxy server is running on port ${PORT}`);
  });
};

const stopProxyServer = () => {
  if (proxyServer) {
    proxyServer.close();
    proxyServer = null;
  }
};

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
  // 启动代理服务器
  startProxyServer();

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
    if (url.includes('jira.logisticsteam.com')) {
      // 将请求重定向到本地代理服务器
      const proxyUrl = url.replace('https://jira.logisticsteam.com', 'http://localhost:3000');
      console.log(`Redirecting request from ${url} to ${proxyUrl}`);
      callback({
        redirectURL: proxyUrl
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

// 在应用退出时停止代理服务器
app.on('before-quit', () => {
  stopProxyServer();
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
