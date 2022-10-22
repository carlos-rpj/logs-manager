const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('serverlessAPI', {
  functions: () => ipcRenderer.invoke('list:functions'),
  logStart: (func, callback) => {
    ipcRenderer.invoke(`log:start`, func)
    ipcRenderer.on(`log:${func}`, callback)
  },
  logStop: (func, callback) => {
    ipcRenderer.invoke(`log:stop`, func)
    ipcRenderer.removeListener(`log:${func}`, callback)
  },
});