const { app, BrowserWindow, ipcMain, dialog, Menu, globalShortcut, shell } = require('electron');
const fs = require('fs');
const path = require('path');

// 禁用硬件加速
app.disableHardwareAcceleration();

// 全局窗口对象
let mainWindow = null;

// 核心配置
const userDataPath = app.getPath('userData');
const scanResultPath = path.join(userDataPath, 'scanResult.json');
const shortcutConfigPath = path.join(userDataPath, 'shortcuts.json');
const wheelConfigPath = path.join(userDataPath, 'wheel-settings.json');

// 默认快捷键配置
const defaultShortcuts = {
  scan: 'Ctrl+O',
  quit: 'Ctrl+Q',
  refresh: 'Ctrl+R',
  about: 'F1',
  nextImage: 'ArrowRight',
  prevImage: 'ArrowLeft',
  zoomIn: 'Ctrl+Plus',
  zoomOut: 'Ctrl+Minus',
  resetZoom: 'Ctrl+0',
  closeViewer: 'Escape'
};

// 简化的默认滚轮配置
const defaultWheelSettings = {
  wheelMode: 'zoom',  // 默认：滚轮缩放
  zoomStep: 0.05      // 缩放步长
};

// ========== 快捷键配置处理 ==========
function loadShortcuts() {
  try {
    if (fs.existsSync(shortcutConfigPath)) {
      const data = fs.readFileSync(shortcutConfigPath, 'utf8');
      const loaded = JSON.parse(data);
      return { ...defaultShortcuts, ...loaded };
    }
    return { ...defaultShortcuts };
  } catch (err) {
    console.error('加载快捷键失败：', err);
    return { ...defaultShortcuts };
  }
}

function saveShortcuts(shortcuts) {
  try {
    if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true });
    fs.writeFileSync(shortcutConfigPath, JSON.stringify(shortcuts, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('保存快捷键失败：', err);
    return false;
  }
}

// ========== 滚轮配置处理 ==========
function loadWheelSettings() {
  try {
    if (fs.existsSync(wheelConfigPath)) {
      const data = fs.readFileSync(wheelConfigPath, 'utf8');
      const loaded = JSON.parse(data);
      return { ...defaultWheelSettings, ...loaded };
    }
    return { ...defaultWheelSettings };
  } catch (err) {
    console.error('加载滚轮设置失败：', err);
    return { ...defaultWheelSettings };
  }
}

function saveWheelSettings(wheelSettings) {
  try {
    if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true });
    fs.writeFileSync(wheelConfigPath, JSON.stringify(wheelSettings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('保存滚轮设置失败：', err);
    return false;
  }
}

// 注册全局快捷键
function registerShortcuts(shortcuts) {
  globalShortcut.unregisterAll();
  
  if (shortcuts.scan) globalShortcut.register(shortcuts.scan, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: '选择写真根目录',
      buttonLabel: '确认选择',
    });
    if (!result.canceled) mainWindow.webContents.send('trigger-scan', result.filePaths[0]);
  });

  if (shortcuts.quit) globalShortcut.register(shortcuts.quit, () => app.quit());
  if (shortcuts.refresh) globalShortcut.register(shortcuts.refresh, () => {
    mainWindow.webContents.send('trigger-refresh');
  });
  if (shortcuts.about) globalShortcut.register(shortcuts.about, () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '关于写真匣子',
      message: '写真匣子 v1.0\n\n基于 Electron 开发\n© 2025 版权所有',
      buttons: ['确定']
    });
  });
}

// 原生生成唯一ID
function generateUUID() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'build/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    registerShortcuts(loadShortcuts());
  });

  // 阻止按住Ctrl键点击链接时打开新窗口
  mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options) => {
    // 如果是外部URL，使用默认浏览器打开
    if (!url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    } else {
      // 阻止所有新窗口打开
      event.preventDefault();
      
      // 提取HTML文件名
      let htmlFile = url;
      if (htmlFile.includes('/')) {
        htmlFile = htmlFile.split('/').pop();
      }
      if (!htmlFile.endsWith('.html')) {
        htmlFile = htmlFile + '.html';
      }
      
      // 在当前窗口加载目标页面
      try {
        mainWindow.loadFile(path.join(__dirname, htmlFile));
      } catch (error) {
        console.error('加载页面失败:', error);
      }
    }
  });
  
  // 也处理will-navigate事件，确保所有导航都在当前窗口
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // 如果是外部URL，使用默认浏览器打开
    if (!url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    globalShortcut.unregisterAll();
    mainWindow = null;
  });

  mainWindow.on('close', (e) => {
    if (mainWindow) {
      e.preventDefault();
      dialog.showMessageBox(mainWindow, {
        type: 'question',
        title: '确认退出',
        message: '确定要退出写真匣子吗？',
        buttons: ['取消', '确定'],
        defaultId: 0,
      }).then((result) => {
        if (result.response === 1) {
          globalShortcut.unregisterAll();
          mainWindow = null;
          app.quit();
        }
      });
    }
  });

  // 构建菜单
  function buildMenu() {
    const shortcuts = loadShortcuts();
    const menuTemplate = [
      {
        label: '文件',
        submenu: [
          {
            label: '选择扫描目录',
            accelerator: shortcuts.scan,
            click: async () => {
              const result = await dialog.showOpenDialog(mainWindow, {
                properties: ['openDirectory'],
                title: '选择写真根目录',
                buttonLabel: '确认选择',
              });
              if (!result.canceled) mainWindow.webContents.send('trigger-scan', result.filePaths[0]);
            }
          },
          {
            label: '刷新列表',
            accelerator: shortcuts.refresh,
            click: () => {
              mainWindow.webContents.send('trigger-refresh');
            }
          },
          { type: 'separator' },
          {
            label: '退出',
            accelerator: shortcuts.quit,
            click: () => app.quit()
          }
        ]
      },
      {
        label: '设置',
        submenu: [
          {
            label: '快捷键设置',
            click: () => {
              const shortcutWindow = new BrowserWindow({
                width: 500,
                height: 550,
                parent: mainWindow,
                modal: true,
                resizable: false,
                title: '快捷键设置',
                webPreferences: {
                  nodeIntegration: true,
                  contextIsolation: false,
                  enableRemoteModule: true,
                }
              });
              shortcutWindow.loadFile(path.join(__dirname, 'shortcut-settings.html'));
              shortcutWindow.setMenu(null);
            }
          }
        ]
      },
      {
        label: '帮助',
        submenu: [
          {
            label: '关于',
            accelerator: shortcuts.about,
            click: () => {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: '关于写真匣子',
                message: '写真匣子 v1.0\n\n基于 Electron 开发\n© 2025 版权所有',
                buttons: ['确定']
              });
            }
          }
        ]
      }
    ];

    const appMenu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(appMenu);
  }

  buildMenu();

  // ========== IPC接口 ==========
  // 快捷键相关
  ipcMain.handle('get-current-shortcuts', async () => {
    return loadShortcuts();
  });

  ipcMain.handle('update-shortcuts', async (_, newShortcuts) => {
    const success = saveShortcuts(newShortcuts);
    if (success) {
      registerShortcuts(newShortcuts);
      buildMenu();
      return { success: true, message: '快捷键设置已保存' };
    } else {
      return { success: false, message: '保存快捷键失败' };
    }
  });

  ipcMain.handle('restore-default-shortcuts', async () => {
    const success = saveShortcuts(defaultShortcuts);
    if (success) {
      registerShortcuts(defaultShortcuts);
      buildMenu();
      return { success: true, message: '已恢复默认快捷键' };
    } else {
      return { success: false, message: '恢复默认快捷键失败' };
    }
  });

  // 滚轮设置相关
  ipcMain.handle('get-wheel-settings', async () => {
    return loadWheelSettings();
  });

  ipcMain.handle('update-wheel-settings', async (_, newWheelSettings) => {
    const success = saveWheelSettings(newWheelSettings);
    if (success) {
      mainWindow.webContents.send('wheel-settings-updated', newWheelSettings);
      return { success: true, message: '滚轮设置已保存' };
    } else {
      return { success: false, message: '保存滚轮设置失败' };
    }
  });

  ipcMain.handle('restore-default-wheel-settings', async () => {
    const success = saveWheelSettings(defaultWheelSettings);
    if (success) {
      mainWindow.webContents.send('wheel-settings-updated', defaultWheelSettings);
      return { success: true, message: '已恢复默认滚轮设置' };
    } else {
      return { success: false, message: '恢复默认滚轮设置失败' };
    }
  });
}

// ========== 扫描/图片处理IPC接口 ==========
ipcMain.handle('scanFolder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: '选择写真根目录',
      buttonLabel: '确认选择',
    });

    if (result.canceled || result.filePaths.length === 0) return [];

    const rootDir = result.filePaths[0];
    const modelList = [];

    const modelDirs = fs.readdirSync(rootDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    if (modelDirs.length === 0) return [];

    for (const modelName of modelDirs) {
      const modelDir = path.join(rootDir, modelName);
      const workDirs = fs.readdirSync(modelDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      const works = [];

      for (const workName of workDirs) {
        const workDir = path.join(modelDir, workName);
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        
        // 递归查找作品目录下的所有图片文件
        const imageFiles = [];
        
        function findImagesRecursively(dir) {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const entryPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              // 递归处理子文件夹
              findImagesRecursively(entryPath);
            } else if (entry.isFile() && imageExts.includes(path.extname(entry.name).toLowerCase())) {
              // 找到图片文件，添加到列表中
              imageFiles.push(entryPath);
            }
          }
        }
        
        // 从作品目录开始递归查找图片
        findImagesRecursively(workDir);
        
        // 对图片文件进行排序
        imageFiles.sort();

        if (imageFiles.length === 0) continue;

        works.push({
          id: generateUUID(),
          name: workName,
          cover: imageFiles[0],
          images: imageFiles,
          path: workDir,
        });
      }

      if (works.length === 0) continue;

      modelList.push({
        id: generateUUID(),
        name: modelName,
        cover: works[0].cover,
        works: works,
        path: modelDir,
      });
    }

    return modelList;
  } catch (err) {
    console.error('扫描失败:', err);
    dialog.showErrorBox('扫描失败', `扫描过程中出现错误：${err.message}`);
    return [];
  }
});

ipcMain.handle('getImageBase64', async (_, imagePath) => {
  try {
    if (!fs.existsSync(imagePath)) throw new Error('图片文件不存在');
    const buffer = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase().replace('.', '');
    return `data:image/${ext};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error('转换图片失败:', err);
    return '';
  }
});

ipcMain.handle('save-scan-result', async (_, result) => {
  try {
    if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true });
    fs.writeFileSync(scanResultPath, JSON.stringify(result, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('保存扫描结果失败:', err);
    return false;
  }
});

ipcMain.handle('load-scan-result', async () => {
  try {
    if (fs.existsSync(scanResultPath)) {
      const data = fs.readFileSync(scanResultPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (err) {
    console.error('加载扫描结果失败:', err);
    return [];
  }
});

ipcMain.on('trigger-scan', async (event, rootDir) => {
  mainWindow.webContents.send('scan-triggered');
});

ipcMain.on('trigger-refresh', () => {
  mainWindow.webContents.send('refresh-triggered');
});

// 文件选择对话框
ipcMain.handle('show-open-dialog', async (_, options) => {
  try {
    return await dialog.showOpenDialog(mainWindow, options);
  } catch (err) {
    console.error('显示文件选择对话框失败:', err);
    return { canceled: true, filePaths: [] };
  }
});

// 用默认浏览器打开URL
ipcMain.handle('open-external-url', async (_, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (err) {
    console.error('打开外部URL失败:', err);
    return { success: false, error: err.message };
  }
});

// 检查GitHub更新
async function checkGitHubUpdate() {
  const https = require('https');
  const currentVersion = app.getVersion();
  const repoUrl = 'api.github.com';
  const repoPath = '/repos/noocrush/photo-box/releases/latest';

  return new Promise((resolve, reject) => {
    const options = {
      hostname: repoUrl,
      path: repoPath,
      method: 'GET',
      headers: {
        'User-Agent': 'PhotoManagerApp'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const release = JSON.parse(data);
          
          // 如果API响应表明没有发布版本（可能是404或其他错误）
          if (!release || !release.tag_name) {
            // 优雅处理：没有发布版本，所以当前版本就是最新版本
            resolve({
              hasUpdate: false,
              latestVersion: currentVersion,
              currentVersion: currentVersion,
              releaseUrl: '',
              releaseNotes: ''
            });
            return;
          }
          
          const latestVersion = release.tag_name.replace('v', '');
          
          // 比较版本号
          const isUpdateAvailable = compareVersions(latestVersion, currentVersion);
          resolve({
            hasUpdate: isUpdateAvailable,
            latestVersion: latestVersion,
            currentVersion: currentVersion,
            releaseUrl: release.html_url || '',
            releaseNotes: release.body || ''
          });
        } catch (error) {
          // 解析错误时，优雅地处理为没有更新
          resolve({
            hasUpdate: false,
            latestVersion: currentVersion,
            currentVersion: currentVersion,
            releaseUrl: '',
            releaseNotes: ''
          });
        }
      });
    });

    req.on('error', (error) => {
      // 网络错误时，优雅地处理为没有更新
      resolve({
        hasUpdate: false,
        latestVersion: currentVersion,
        currentVersion: currentVersion,
        releaseUrl: '',
        releaseNotes: ''
      });
    });

    req.end();
  });
}

// 比较版本号 (简单的版本号比较)
function compareVersions(latest, current) {
  const latestParts = latest.split('.').map(Number);
  const currentParts = current.split('.').map(Number);

  for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
    const latestVal = latestParts[i] || 0;
    const currentVal = currentParts[i] || 0;

    if (latestVal > currentVal) {
      return true;
    } else if (latestVal < currentVal) {
      return false;
    }
  }
  return false;
}

// 显示更新提醒对话框
function showUpdateDialog(updateInfo) {
  if (!updateInfo.hasUpdate) return;

  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: '发现新版本',
    message: `有新版本可用！\n\n当前版本: v${updateInfo.currentVersion}\n最新版本: v${updateInfo.latestVersion}\n\n更新内容:\n${updateInfo.releaseNotes || '无详细信息'}\n\n是否前往GitHub下载？`,
    buttons: ['稍后再说', '前往下载'],
    defaultId: 1,
    cancelId: 0
  }).then((result) => {
    if (result.response === 1) {
      shell.openExternal(updateInfo.releaseUrl);
    }
  });
}

// 应用生命周期
app.whenReady().then(async () => {
  createWindow();
  
  // 启动后检查更新
  setTimeout(async () => {
    try {
      const updateInfo = await checkGitHubUpdate();
      if (updateInfo.hasUpdate) {
        showUpdateDialog(updateInfo);
      }
    } catch (error) {
      console.log('检查更新失败:', error.message);
    }
  }, 3000); // 延迟3秒检查，避免影响应用启动速度
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});