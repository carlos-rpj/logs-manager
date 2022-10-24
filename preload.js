const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('serverlessAPI', {
  logStart: async (func, callback) => {
    await ipcRenderer.invoke(`log:start`, func)
    ipcRenderer.on(`log:${func}`, callback)
  },
  logStop: async (func, callback) => {
    await ipcRenderer.invoke(`log:stop`, func)
    ipcRenderer.removeListener(`log:${func}`, callback)
  },
  onStart: async (callback) => {
    await ipcRenderer.invoke('dialog:openProject')
    ipcRenderer.once('list:functions', callback)
  },
});