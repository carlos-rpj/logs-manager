const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('serverlessAPI', {
  functions: () => ipcRenderer.invoke('list:functions'),
  handleLog: (func, callback) => ipcRenderer.on(`log:${func}`, callback)
});