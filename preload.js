const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  navigateTo: (url) => ipcRenderer.send('navigate-to', url),
  requestNewTab: () => ipcRenderer.send('new-tab-request'),
  requestCloseTab: (tabId) => ipcRenderer.send('close-tab-request', tabId),
  onNavigateRequest: (callback) => ipcRenderer.on('navigate-request', (_event, url) => callback(url)),
  onNewTab: (callback) => ipcRenderer.on('new-tab', () => callback()),
  onCloseTab: (callback) => ipcRenderer.on('close-tab', (_event, tabId) => callback(tabId)),
});
