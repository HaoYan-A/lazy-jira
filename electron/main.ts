import { app, BrowserWindow, ipcMain, shell } from 'electron';

// 添加 shell.openExternal 的处理程序
ipcMain.handle('shell:openExternal', async (event, url) => {
  try {
    await shell.openExternal(url);
    return true;
  } catch (error) {
    console.error('Error opening external URL:', error);
    return false;
  }
}); 