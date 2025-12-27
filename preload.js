const { contextBridge, ipcRenderer } = require('electron');

// 向前端暴露核心API
contextBridge.exposeInMainWorld('electronAPI', {
  scanFolder: () => ipcRenderer.invoke('scanFolder'),
  getImageBase64: (imagePath) => ipcRenderer.invoke('getImageBase64', imagePath),
  saveScanResult: (result) => ipcRenderer.invoke('save-scan-result', result),
  loadScanResult: () => ipcRenderer.invoke('load-scan-result'),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
});