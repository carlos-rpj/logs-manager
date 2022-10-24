const YAML = require('yaml')
const path = require('path')
const fs = require('fs')

const { spawn } = require('node:child_process');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const assert = require('assert');

class LogServerlessFunction {
  process = null
  aws_profile = 'qas-maqplan'
  stage = 'dev'
  running = false
  projectPath = './'

  constructor(name, info) {
    this.name = name
    this.info = info
  }

  start(browserWindow = null) {
    try {
      assert(browserWindow, 'BrowserWindow can\'t be null')
      assert(!this.running, 'Process is already running')

      this.browserWindow = browserWindow
      this.running = true

      const params = ['logs', '-t', '--aws-profile', this.aws_profile, '--stage', this.stage, '-f', this.name];

      this.process = spawn('sls', params, { cwd: this.projectPath });
      this.process.stdout.on('data', this.onMessage.bind(this));
      this.process.stderr.on('data', this.onError.bind(this));
  
      this.process.on('exit', (code) => {
        this.running = false
        console.log(`Child exited with code ${code}`);
      });
  
      return this.process
    } catch (error) {
      console.error(error)
    }
  }

  stop() {
    this.process?.kill()
  }

  onMessage(data) {
    this.browserWindow.webContents.send(`log:${this.name}`, data.toString())
  }

  onError(data) {
    console.error(data.toString());
  }
}

const logs = new Map()

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadFile('src/index.html')

  ipcMain.handle('log:start', (event, name) => {
    console.info('LOG STARTED', name)
    logs.get(name).start(mainWindow)
  })
  
  ipcMain.handle('log:stop', (event, name) => {
    console.info('LOG STOPED', name)
    logs.get(name).stop()
  })

  ipcMain.handle('dialog:openProject', () => {
    const [projectPath] = dialog.showOpenDialogSync(mainWindow, {
      properties: ['openDirectory']
    });

    const functions = getLambdaFunctions(projectPath)

    Object.entries(functions).forEach(data => {
      const [name, info] = data
      const log = new LogServerlessFunction(name, info)

      log.projectPath = projectPath
      logs.set(name, log)
    })

    mainWindow.webContents.send('list:functions', functions)
  })

  mainWindow.webContents.openDevTools()
}

function getLambdaFunctions(path) {
  const file = fs.readFileSync(`${path}/serverless.yml`, 'utf8')
  const serverless_yaml = YAML.parse(file);

  return serverless_yaml.functions;
}

app.whenReady().then(() => {
  ipcMain.handle('list:functions', (e, path) => getLambdaFunctions(path))

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
