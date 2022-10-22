const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('serverlessAPI', {
  functions: () => ipcRenderer.invoke('list:functions'),
  logStart: async (func, callback) => {
    await ipcRenderer.invoke(`log:start`, func)
    ipcRenderer.on(`log:${func}`, callback)
  },
  logStop: async (func, callback) => {
    await ipcRenderer.invoke(`log:stop`, func)
    ipcRenderer.removeListener(`log:${func}`, callback)
  },
});