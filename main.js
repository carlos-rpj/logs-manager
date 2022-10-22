const YAML = require('yaml')
const path = require('path')
const fs = require('fs')

const { spawn } = require('node:child_process');
const { app, BrowserWindow, ipcMain } = require('electron');
const assert = require('assert');

const PROJECT_PATH = '/home/carlos/Documents/maqplan/Projetos/maqplug'
let proccessLog = null

class LogServerlessFunction {
  process = null
  aws_profile = 'qas-maqplan'
  stage = 'dev'
  running = false

  constructor(name, info) {
    this.name = name
    this.info = info
  }

  start(browserWindow = null) {
    assert(browserWindow, 'BrowserWindow can\'t be null')
    assert(this.running, 'Process is already running')

    this.browserWindow = browserWindow
    this.running = true

    try {
      const params = ['logs', '-t', '--aws-profile', this.aws_profile, '--stage', this.stage, '-f', this.name];

      this.process = spawn('sls', params, { cwd: PROJECT_PATH });
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

const logs = new Map(Object.entries(getLambdaFunctions()).map(data => {
  const [name, info] = data
  return [name, new LogServerlessFunction(name, info)]
}))

function createWindow() {
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

  mainWindow.webContents.openDevTools()
}

function getLambdaFunctions() {
  const file = fs.readFileSync(`${PROJECT_PATH}/serverless.yml`, 'utf8')
  const serverless_yaml = YAML.parse(file);

  return serverless_yaml.functions;
}

app.whenReady().then(() => {
  ipcMain.handle('list:functions', getLambdaFunctions)

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
    proccessLog?.kill()
  }
})
