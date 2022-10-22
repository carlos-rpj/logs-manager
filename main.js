const YAML = require('yaml')
const path = require('path')
const fs = require('fs')

const { spawn } = require('node:child_process');
const { app, BrowserWindow, ipcMain } = require('electron')

const PROJECT_PATH = '/home/carlos/Documents/maqplan/Projetos/maqplug'
let proccessLog = null

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadFile('src/index.html')

  const log = new LogServerlessFunction(mainWindow, 'dequeue')
  log.start()

  mainWindow.webContents.openDevTools()
}

class LogServerlessFunction {
  process = null
  aws_profile = 'qas-maqplan'
  stage = 'dev'

  constructor(browserWindow, name) {
    this.browserWindow = browserWindow
    this.name = name
  }

  start() {
    try {
      const params = ['logs', '-t', '--aws-profile', this.aws_profile, '--stage', this.stage, '-f', this.name];

      console.log(params)

      this.process = spawn('sls', params, { cwd: PROJECT_PATH });
      this.process.stdout.on('data', this.onMessage.bind(this));
      this.process.stderr.on('data', this.onError.bind(this));
  
      this.process.on('exit', (code) => {
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
