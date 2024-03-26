import path from 'path'
import fs from 'fs'
import http from 'http'
import { app, ipcMain, webContents } from 'electron'
import serve from 'electron-serve'
import defaultConfig from './config'
import { createWindow } from './helpers'
import { sendError } from 'next/dist/server/api-utils'
import { message } from 'antd'

interface MessageItem {
  id: number;
  title: string;
  sender: string;
  content: string;
  attachments?: {
    url: string;
    filename: string;
    hashValue: string;
  }[];
}

let config = defaultConfig;
config.fileSavingPath = 'downloads'
let fileSavingPath = config.fileSavingPath

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
}

app.on('second-instance', (event, commandLine, workingDirectory) => {
  showmainWindow();
})
async function LoadPage(window: { loadURL: (arg0: string) => any }, pageRute: string) {
  if (isProd) {
    await window.loadURL('app://.' + pageRute + '/page')
  } else {
    const port = process.argv[2]
    await window.loadURL(`http://localhost:${port}` + pageRute + '/page')
  }
}

function downloadFileByHashValue(webcontents: Electron.WebContents, hashValue: string, filename: string, path: string) {
  if (!fs.existsSync(fileSavingPath + "/" + path)) {
    fs.mkdirSync(fileSavingPath + "/" + path, { recursive: true });
  }
  let finalPath = fileSavingPath + "/" + path + "/" + filename;
  fs.open(finalPath, () => {
    const file = fs.createWriteStream(finalPath);
    const request = http.get(_serverUrl + "/download/" + hashValue, (response) => {

      const totalBytes = response.headers['content-length'];

      response.pipe(file);

      response.on('data', (chunk) => {
        const downloadedBytes = file.bytesWritten;
        console.log(downloadedBytes)
        console.log(hashValue)
        let progress = (downloadedBytes / Number(totalBytes)) * 100;

        webcontents ? webcontents.send('download-progress', progress, hashValue) : null;
      });

      file.on('finish', () => {
        file.close();
        webcontents ? webcontents.send('download-complete', hashValue) : null;
      });
    });

    request.on('error', (error) => {
      fs.unlink(fileSavingPath, null);
      webcontents ? webcontents.send('download-error', error.message, hashValue) : null;
    });
  })
}

const { BrowserWindow } = require('electron');
const Store = require('electron-store');
const { exec } = require('child_process');
const WebSocket = require('ws');
let store = new Store()
app.commandLine.appendSwitch('wm-window-animations-disabled');

//TODO:重构代码
// interface window{
//   browserWindow : Electron.CrossProcessExports.BrowserWindow;
//   show : Function 
// }

// interface RenderWindows {
//   loginWindow: window;
//   loadWindow: window;
//   dialogWindow: window;
//   mainWindow: window;
//   scheduleWindow: window;
//   homeworkWindow: window;
//   smallhomeworkWindow: window;
//   signalMessageWindow: window;
// }

interface RenderWindows {
  loginWindow: Electron.CrossProcessExports.BrowserWindow;
  loadWindow: Electron.CrossProcessExports.BrowserWindow;
  dialogWindow: Electron.CrossProcessExports.BrowserWindow;
  mainWindow: Electron.CrossProcessExports.BrowserWindow;
  scheduleWindow: Electron.CrossProcessExports.BrowserWindow;
  homeworkWindow: Electron.CrossProcessExports.BrowserWindow;
  smallhomeworkWindow: Electron.CrossProcessExports.BrowserWindow;
  signalMessageWindow: Electron.CrossProcessExports.BrowserWindow;

}

let OPwindows: RenderWindows = {
  loginWindow: null,
  loadWindow: null,
  dialogWindow: null,
  mainWindow: null,
  scheduleWindow: null,
  homeworkWindow: null,
  smallhomeworkWindow: null,
  signalMessageWindow: null,
};


let homeworkWindowClosed = false;

let ws: { onopen: () => void; onmessage: (evt: any) => void; onclose: (event: any) => void; onerror: () => void; send: (arg0: string) => void; readyState: any };
let isLogined = false;
let nextJSData: { command: string; content: { userPassword: any } };
let reconnectInterval: string | number | NodeJS.Timeout;

let globalMessageObj: MessageItem
let globalMessageList: MessageItem[]
let lastDialogMessage: MessageItem

let userId: any
let userName: any

const _classStorageByDay = 'classOnDay'
const _messageStorageList = 'messageList'
const _homeWorkStorageByDay = 'homeworkOnDay'
const _tasksStorage = 'tasksEachDay'
const _configData = 'config'

const _serverUrl = 'http://106.53.58.190:8900'
let storedConfig = store.get(_configData)
config = storedConfig ? storedConfig : config;

function saveConfig() {
  store.set(_configData, config)
}

let tasks = store.get(_tasksStorage);
tasks = tasks ? tasks : [
  // { cmd: "任务1", time: Date.now() + 5000 }
];

let classes = store.get(_classStorageByDay + String(new Date().getDay()));
if (classes == undefined) {
  classes = [
    { turn: 1, time: '07:40', subject: '语文', show: true },
    { turn: 2, time: '08:30', subject: '英语', show: true },
    { turn: 3, time: '09:20', subject: '数学', show: true },
    { turn: 4, time: '10:00', subject: '大课间', show: false },
    { turn: 5, time: '10:30', subject: '自习', show: true },
    { turn: 6, time: '11:20', subject: '数学', show: true },
    { turn: 7, time: '13:15', subject: '午休', show: false },
    { turn: 8, time: '14:30', subject: '政治', show: true },
    { turn: 9, time: '15:20', subject: '物理', show: true },
    { turn: 10, time: '16:10', subject: '自习', show: true },
    { turn: 11, time: '16:50', subject: '大课间', show: false },
    { turn: 12, time: '17:20', subject: '化学', show: true },
    { turn: 13, time: '19:30', subject: '自习', show: true },
    { turn: 14, time: '20:10', subject: '自习', show: true },
    { turn: 15, time: '21:10', subject: '自习', show: true },
  ];
}


function compareTimes(time1: { split: (arg0: string) => { (): any; new(): any; map: { (arg0: NumberConstructor): [any, any]; new(): any } } }, time2: string) {
  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);

  const totalMinutes1 = hours1 * 60 + minutes1;
  const totalMinutes2 = hours2 * 60 + minutes2;

  if (totalMinutes1 < totalMinutes2) {
    return -1;
  } else if (totalMinutes1 > totalMinutes2) {
    return 1;
  } else {
    return 0; // 时间相等
  }
}

function showscheduleWindow() {
  let x = store.get('schedule_x');
  let y = store.get('schedule_y');
  let width = store.get('schedule_width');
  let height = store.get('schedule_height');
  OPwindows.scheduleWindow = new BrowserWindow({
    frame: false,
    width: width ? width : 170,
    height: height ? height : 660,
    x: x ? x : 1400,
    y: y ? y : 80,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  OPwindows.scheduleWindow.setSkipTaskbar(true)
  LoadPage(OPwindows.scheduleWindow, '/schedule')
  OPwindows.scheduleWindow.once('ready-to-show', () => {
    if (config.isScheduleShow) {
      OPwindows.scheduleWindow.show();
    }
  })
}
function showmainWindow() {
  OPwindows.mainWindow = new BrowserWindow({
    frame: false,
    width: 800,
    height: 600,
    alwaysOnTop: false,
    autoHideMenuBar: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  LoadPage(OPwindows.mainWindow, '/windows/main')
  OPwindows.mainWindow.once('ready-to-show', () => {
    OPwindows.mainWindow.show();
  })
  OPwindows.mainWindow.on('closed', () => {
    OPwindows.mainWindow = null;
  });
}
function showhomeworkWindow() {
  OPwindows.homeworkWindow = new BrowserWindow({

    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  LoadPage(OPwindows.homeworkWindow, '/homework')
  OPwindows.homeworkWindow.once('ready-to-show', () => {
    OPwindows.homeworkWindow.show();
  })
  OPwindows.homeworkWindow.on('closed', () => {
    OPwindows.homeworkWindow = null;
  });
}
function showsmallhomeworkWindow() {
  OPwindows.smallhomeworkWindow = new BrowserWindow({

    fullscreen: true,
    autoHideMenuBar: true,

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  LoadPage(OPwindows.smallhomeworkWindow, '/homework')
  OPwindows.smallhomeworkWindow.once('ready-to-show', () => {
    OPwindows.smallhomeworkWindow.show();
  })
  OPwindows.smallhomeworkWindow.on('closed', () => {
    OPwindows.smallhomeworkWindow = null;
  });
}
function showShowSignalMessageWindow() {
  OPwindows.mainWindow = new BrowserWindow({
    frame: false,
    width: 900,
    height: 700,
    alwaysOnTop: false,
    autoHideMenuBar: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  LoadPage(OPwindows.mainWindow, '/windows/ShowSignalMessageWindow')
  OPwindows.mainWindow.once('ready-to-show', () => {
    OPwindows.mainWindow.show();
  })
  OPwindows.mainWindow.on('closed', () => {
    OPwindows.mainWindow = null;
  });
}
let reconn = 0;
function startWebSocketConnection() {
  ws = new WebSocket('ws://106.53.58.190:8900/ws');

  ws.onopen = () => {

    console.log('WebSocket connection opened');
    clearInterval(reconnectInterval);
    if (isLogined == false) {
      if (userId) {
        if (reconn == 0) {
          OPwindows.loadWindow = new BrowserWindow({
            frame: false,
            width: 350,
            height: 200,
            alwaysOnTop: false,
            transparent: true,
            autoHideMenuBar: true,
            webPreferences: {
              nodeIntegration: false,
              contextIsolation: true,
              preload: path.join(__dirname, 'preload.js'),
            },
          })
          LoadPage(OPwindows.loadWindow, '/LinearIndeterminate')
          OPwindows.loadWindow.once('ready-to-show', () => {
            OPwindows.loadWindow.show();
          })
          OPwindows.loadWindow.on('closed', () => {
            OPwindows.loadWindow = null;
          });
        } else {
          OPwindows.mainWindow ? OPwindows.mainWindow.webContents.send('networkState', true) : null;
        }
        setTimeout(() => {
          sendObj(store.get('loginDataPack'))

        }, 3000)

      } else {
        OPwindows.loginWindow = new BrowserWindow({
          transparent: true,
          frame: false,
          width: 420,
          height: 490,
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
          },
        });

        LoadPage(OPwindows.loginWindow, '/windows/login')
        console.log('登录窗口已加载')
        OPwindows.loginWindow.once('ready-to-show', () => {
          OPwindows.loginWindow.show();
        })

        OPwindows.loginWindow.on('closed', () => {
          OPwindows.loginWindow = null;
          if (isLogined === false) {
            app.quit();
          }
        });

      }
    }

  };
  ws.onmessage = (evt: { data: string }) => {

    let message = JSON.parse(evt.data)
    globalMessageObj = message;
    console.log('Received message from server:', message);
    switch (message.command) {
      case "login":
        if (message.status === 'error') {
          sendObj(store.get('loginDataPack'))
        }
        if (message.status === 'success') {
          OPwindows.loginWindow ? OPwindows.loginWindow.close() : null;
          OPwindows.loadWindow ? OPwindows.loadWindow.close() : null;
          isLogined = true
          store.set('userName', message.content.userName);
          store.set('userId', message.content.userId)
          userId = message.content.userId;
          userName = message.content.userName;

          showmainWindow();
          showscheduleWindow();

          const intervalInMilliseconds = 5000; // 2秒钟


          setInterval(() => {
            ws.send("heartTick");
            const currentTime = Date.now();
            if (OPwindows.scheduleWindow) {
              let position = OPwindows.scheduleWindow.getPosition();
              store.set('schedule_x', position[0])
              store.set('schedule_y', position[1])
              let winset = OPwindows.scheduleWindow.getSize();
              store.set('schedule_width', winset[0]);
              store.set('schedule_height', winset[1]);
            }

            let maxTurn = 0;
            let date = new Date();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            classes.forEach((aclass: { time: any; turn: number }) => {
              if (compareTimes(aclass.time, `${hours}:${minutes}`) < 0) {
                if (maxTurn <= aclass.turn) {
                  maxTurn = aclass.turn;
                }
              }
            })
            let msg = {
              classList: classes
            }
            OPwindows.scheduleWindow.webContents.send('updateClasses', msg)
            OPwindows.scheduleWindow.webContents.send('updateCurrentClass', maxTurn - 1)
            if (config.autoShowHomework) {
              if ((OPwindows.homeworkWindow == null) && classes[maxTurn - 1]?.subject === '自习' && homeworkWindowClosed === false) {
                showhomeworkWindow();
              }
              if (!(classes[maxTurn - 1]?.subject == '自习')) {
                OPwindows.homeworkWindow ? OPwindows.homeworkWindow.close() : null;
              }
            }
            if (config.useTasks) {
              // 遍历任务数组
              tasks.forEach((task: { time: any; cmd: any }) => {
                // 检查当前时间是否在任务时间允许的误差范围内
                if (Math.abs(task.time - currentTime) <= 10000) {
                  // 执行任务

                  console.log(`${task.cmd} 在 ${new Date(task.time)} 执行`);
                }
              });
            }

          }, intervalInMilliseconds);
        } else {
          if (message.message === '用户不存在') {
            nextJSData.command = 'register'
            sendObj(nextJSData)//自动注册
          } else {
            OPwindows.loginWindow ? AlertToWindow(OPwindows.loginWindow, '登录失败') : null;
          }
        }
        break;
      case 'register':
        if (message.status === 'success') {
          let loginDataPack = {
            command: 'login',
            content: {
              userId: message.content.userId,
              userName: message.content.userName,
              userPassword: nextJSData.content.userPassword,
              deviceType: 1
            }
          }
          store.set('loginDataPack', loginDataPack)
          sendObj(loginDataPack)//自动登录
        } else {
          OPwindows.loginWindow ? AlertToWindow(OPwindows.loginWindow, '注册失败') : null;
        }
        break
      case 'sendMessage':
        let content = message.content;
        switch (content.type) {
          case 'ordinaryMessage':
            let msgObj = content.data;
            globalMessageList.push(msgObj)
            store.set(_messageStorageList, globalMessageList);
            OPwindows.mainWindow ? OPwindows.mainWindow.webContents.send('onMessage', msgObj) : null;
            if (config.autoDownloadFiles) {
              msgObj.attachments.forEach((attachment: { hashValue: string, filename: string }) => {
                downloadFileByHashValue(OPwindows.mainWindow.webContents, attachment.hashValue, attachment.filename, msgObj.sender)
              })
            }
            break
          case 'alertMessage':
            lastDialogMessage = content;
            if (config.allowAlert) {
              OPwindows.dialogWindow = new BrowserWindow({
                frame: false,
                width: 590,
                height: 500,
                alwaysOnTop: false,
                transparent: true,
                autoHideMenuBar: true,
                webPreferences: {
                  nodeIntegration: false,
                  contextIsolation: true,
                  preload: path.join(__dirname, 'preload.js'),
                },
              })
              LoadPage(OPwindows.dialogWindow, '/windows/Dialog')
              OPwindows.dialogWindow.once('ready-to-show', () => {
                OPwindows.dialogWindow.show();
              })
              OPwindows.dialogWindow.on('closed', () => {
                OPwindows.dialogWindow = null;
              });
            }
            break
          case 'classUpdateMessage':
            OPwindows.scheduleWindow ? OPwindows.scheduleWindow.webContents.send('updateClasses', content.data) : null;
            if (content.data) {
              store.set(_classStorageByDay + content.data.day, content.data.classList)
            }
            break
          case 'remoteExecuteMessage':
            let cmd = content.data.cmd;
            exec(cmd, (error: any, stdout: any, stderr: any) => {
              if (error) {
                console.error(`执行命令时发生错误: ${error}`);
                return;
              }
              console.log(`命令执行成功，输出: ${stdout}`);
            });

            break//可以换成remote excute
          case 'fileMessage':
            if (config.autoDownloadFiles) {
              content.attachments.forEach((attachment: { hashValue: string, filename: string }) => {
                downloadFileByHashValue(OPwindows.mainWindow.webContents, attachment.hashValue, attachment.filename, msgObj.sender)
              })
            }
            break
          case 'timerTaskMessage':
            tasks.push(content.data);
            store.set(_tasksStorage, tasks);
            break
          case 'homeworkMessage':
            let date = new Date().getDay();
            let homework = content.data;
            let homeworks = store.get(_homeWorkStorageByDay + date);
            homeworks = homeworks ? [...homeworks, homework] : [homework];
            store.set(_homeWorkStorageByDay + date, homeworks);
            OPwindows.homeworkWindow ? OPwindows.homeworkWindow.webContents.send('uploadHomework', homework) : null;
        }
        break;
    }
  };

  ws.onclose = (event: { code: any }) => {
    console.error(`WebSocket connection closed with code ${event.code}. Reconnecting...`);
    clearInterval(reconnectInterval);
    OPwindows.mainWindow ? OPwindows.mainWindow.webContents.send('networkState', false) : null;
    reconnectInterval = setInterval(() => {
      startWebSocketConnection();

    }, 3000);
    reconn++;
  };
  ws.onerror = () => {
    OPwindows.mainWindow ? OPwindows.mainWindow.webContents.send('networkState', false) : null;
    reconnectInterval = setInterval(() => {
      startWebSocketConnection();
    }, 3000);
    reconn++;
  }
}

function AlertToWindow(Window: { webContents: { send: (arg0: string, arg1: any) => void } }, msg: string) {
  // let msgObj = {
  //   type:type,
  //   message:message,
  // }
  Window.webContents.send('alert', msg);
}

function sendObj(Obj: { command: string; content: any }) {
  ws.send(JSON.stringify(Obj))
  console.log("sending message:", Obj);
}



app.whenReady().then(() => {
  globalMessageList = store.get(_messageStorageList) ? store.get(_messageStorageList) : [];
  //init
  startWebSocketConnection();
  userId = store.get('userId');
  userName = store.get('userName');
  // IPC Area
  ipcMain.handle('getLastMessage', (event, args) => {
    return globalMessageObj;
  })
  let showingMessage:MessageItem
  ipcMain.handle('getShowingMessage', (event, args) => {
    return showingMessage;
  })
  ipcMain.handle('getUserData', (event, args) => {
    return {
      userId: userId,
      userName: userName
    };
  })
  ipcMain.handle('getHomeworkData', () => {
    let homeworks = store.get(_homeWorkStorageByDay + new Date().getDay())
    return homeworks ? homeworks : [];
  })

  ipcMain.handle('getMessages', (event, startMessageId) => {
    if (startMessageId <= 0 && startMessageId != -11) {
      return [null, startMessageId];
    }
    if (globalMessageList.length <= 10) {
      startMessageId = 0;
      return [globalMessageList, startMessageId];
    }
    if (startMessageId == -11) {
      startMessageId = globalMessageList.length - 1;
    }
    //初始化
    let res = [];
    res = globalMessageList.slice(startMessageId <= 10 ? 0 : startMessageId - 10, startMessageId)
    startMessageId = startMessageId - 10;
    return [res, startMessageId];
  })
  ipcMain.handle('getClassesByDay', (event) => {
    return classes;
  })
  ipcMain.handle('getTasks', (event) => {
    return tasks ? tasks : [];
  })
  ipcMain.handle('setTasks', (event, data) => {
    tasks = data;
    store.set(_tasksStorage, data)
  })

  ipcMain.handle('getStorage', (event, name) => {
    let storage = store.get(name);
    return storage ? storage : null;
  })

  ipcMain.handle('setStorage', (event, name, arg) => {
    store.set(name, arg);
    return true;
  })

  ipcMain.handle('checkFileExistance', (event, sender, filename) => {
    let directory = fileSavingPath;
    console.log(sender)
    let fullPath = directory + "\\" + sender + "\\" + filename;
    console.log(fullPath)
    let res: boolean
    try {
      fs.accessSync(fullPath, fs.constants.F_OK)
      return true;
    } catch (e) {
      return false;
    }
  })

  ipcMain.handle('openFile', (event, sender, filename) => {
    let directory = fileSavingPath;
    console.log(sender)
    let fullPath = directory + "\\" + sender + "\\" + filename;
    console.log(fullPath)
    fs.access(fullPath, fs.constants.F_OK, (err) => {
      if (err) {
        console.log('文件不存在');
        return false;
      } else {
        console.log('文件存在');
        exec('start ' + fullPath, (err) => {
          if (err) {
            return console.error('无法打开文件:', err);
          }
          console.log('文件已打开');
        });
      }
    });
  })
  ipcMain.handle('openFolder', (event, sender) => {
    let directory = fileSavingPath + "\\";
    let fullPath = directory + sender;
    exec('start ' + fullPath, (err) => {
      if (err) {
        return console.error('无法打开文件夹:', err);
      }
      console.log('文件夹已打开');
    });
    return true;
  })

  ipcMain.handle('scheduleWindowDisplay', (event, display) => {
    if (display == true) {
      OPwindows.scheduleWindow.show()
    } else if (display == false) {
      OPwindows.scheduleWindow.minimize();
    }
    config.isScheduleShow = display
    saveConfig()
    return true;
  })

  ipcMain.handle('getConfig', () => { return config })
  ipcMain.handle('setConfig', (event, newconfig) => {
    config = newconfig
    saveConfig();
  })
  ipcMain.handle('openhomeworkWindow', () => {
    showsmallhomeworkWindow()
  })

  ipcMain.on('closehomeworkWindow', () => {
    if (OPwindows.homeworkWindow) {
      homeworkWindowClosed = true;
      OPwindows.homeworkWindow.close();
    }
    if (OPwindows.smallhomeworkWindow) {
      OPwindows.smallhomeworkWindow.close();
    }
  })

  ipcMain.on('download-file', (event, hashValue, filename, sender) => {
    downloadFileByHashValue(event.sender, hashValue, filename, sender)

  });

  ipcMain.handle('delete-message', (event, messageId) => {
    let state: boolean = false;
    globalMessageList.forEach((message, index) => {
      if (message.id == messageId) {
        globalMessageList.splice(index, 1);
        store.set(_messageStorageList, globalMessageList)
        state = true;
      }
    })
    return state;
  })
  ipcMain.handle('showSignalMessage', (event, message) => {
    showingMessage = message;
    showShowSignalMessageWindow();
  })
  
  ipcMain.on('nextjs-message', (event, data) => {
    if (ws.readyState === WebSocket.OPEN) {
      nextJSData = data;
      sendObj(nextJSData);
    } else {
      console.error('WebSocket connection is not open');
    }
  });
  ipcMain.on('minimize-window', () => {
    const selectedWindow = BrowserWindow.getFocusedWindow();
    if (selectedWindow) {
      selectedWindow.minimize();
    }
  });

  ipcMain.on('close-window', () => {
    const selectedWindow = BrowserWindow.getFocusedWindow();
    if (selectedWindow) {
      selectedWindow.close();
    }
  });


  // 隐藏窗口的任务栏图标


});

app.on('window-all-closed', () => {
  if (isLogined === false) {
    app.quit();
  }
});

app.on('activate', () => {
  if (OPwindows.loginWindow === null) {
    if (isLogined === false) {
      app.quit();
    }
  }
});
