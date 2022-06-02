'use strict'

//第三方库 
import { v1 } from 'appstoreconnect'
//本地数据库
import DB from './datastore'

import { app, protocol, BrowserWindow,ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'

const os = require('os')
const ElectronStore = require('electron-store');
//初始化ElectronStore
ElectronStore.initRenderer();


// 环境设置 开发-true 发布：false
process.env.IS_TEST=true

const isDevelopment = process.env.NODE_ENV !== 'production'

const path = require('path')
let win = null
app.setName("iOS 上传工具")

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
    win = new BrowserWindow({
    height: 300,
		width: 700,
		minWidth: 650,
		maxWidth: 800,
		minHeight: 300,
		maxHeight: 400,
    title:"iOS上传工具",
    webPreferences: {
      nodeIntegration: true,// 允许页面集成node模块
      contextIsolation: false,
      webSecurity: false,// 取消跨域限制
      enableRemoteModule:true //打开remote模块
    }
  })

  win.on('page-title-updated', function (event,title) {
    event.preventDefault();
 })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}



/**用户自定义方法*/ 
function run_CmdSilent(cmd,callback) {
  var exec = require('child_process').exec;
  exec(cmd, {
    encoding: 'utf8',
    timeout: 0,
    maxBuffer: 5000 * 1024, // 默认 200 * 1024
    killSignal: 'SIGTERM'
  }, function(err, stdout, stderr) {
    if (err) throw err;
    console.log(stdout)
  });
};

function run_child_process(cmd,callback) {
  var exec = require('child_process').exec;
  exec(cmd, function(err, stdout, stderr) {
    if (err) throw err;
    callback(stdout)
  });
};



function ipcMainMsgAction() {
console.log("自定义函数")
}


function sendMsgToRender(data) {
console.log("给渲染进程发送消息========")
//给渲染进程发送消息
win.webContents.send('main-send-to-render', data)
}

function verifyAnUplodAction(data,isUpload){
    console.log(data)
    var ipa_path = data["ipa_path"]
    var AuthKey_path = data["AuthKey_path"]
    var apiIssuer = data["apiIssuer"]
    var AuthKey_Name = AuthKey_path.substring(AuthKey_path.lastIndexOf('/')+1);
    var apiKey = AuthKey_Name.substr("AuthKey_".length, 10);
    var bundleID = data["CFBundleIdentifier"]
    var appName = data["CFBundleDisplayName"]

    const fs = require('fs')
    var privateKey=fs.readFileSync(AuthKey_path, 'utf8')
    const issuerId = '4ba6cf71-2eab-4917-b375-e407816ad86b' // replace with your issuer ID
    const keyId = 'JTQT6Z6FKW' // replace with your key ID
    const token = v1.token(privateKey, apiIssuer, apiKey)
    console.log(token)

    const https = require("https");
    // const url = "https://api.appstoreconnect.apple.com/v1/apps";
    var option={
        hostname:'api.appstoreconnect.apple.com',
        path:'/v1/apps',
        headers:{
          'Accept':'*/*',
          'Accept-Encoding':'utf-8',
          'Accept-Language':'zh-CN,zh;q=0.8',
          'Authorization':'Bearer ' + token
        }
      };
    const get=https.get(option,function(res){
      if (res.statusCode !== 200) {
        console.log(res.statusCode);
        const msgData = {
          "channel": "error",
          "data": {
            "title": "Authentication credentials are missing or invalid."
          }
        }
        sendMsgToRender(msgData)
      }else{
        console.log("验证成功！！！");
         // 是否已保存密钥对
        const row=DB.query(`SELECT * FROM HistoryInfoTable where AuthKey='${AuthKey_Name}' and Issuer_ID='${apiIssuer}'`)
        if (row.length>0){
          console.log(row)
          console.log("已保存")
        }else{
          console.log("未查询到记录,开始保存")
          let insertData={UUID:DB.UUID(),AuthKey:AuthKey_Name, Issuer_ID: apiIssuer,CFBundleIdentifier:bundleID,CFBundleDisplayName:appName,info:DB.currentFormatDate()}
          console.log(insertData)
          DB.run('INSERT INTO HistoryInfoTable (UUID,AuthKey, Issuer_ID,CFBundleIdentifier,CFBundleDisplayName,info) VALUES (@UUID,@AuthKey, @Issuer_ID,@CFBundleIdentifier,@CFBundleDisplayName,@info)',insertData)
        }

        if(isUpload){
          //上传
          uploadIPAAction(data);
        }else{
          const msgData = {
            "channel": "success",
            "data": {
              "title": "验证成功"
            }
          }
          console.log("验证成功!!!")
          sendMsgToRender(msgData)
        }
      }
      res.on('data',function(d){
          console.log(d.toString());
      })
    })
    get.on('error', error => {
      console.error(`error:{error}`)
    })
    get.end()
}

// 上传IPA-使用终端命令上传性能佳
function uploadIPAAction(data) {
      var ipa_path = data["ipa_path"]
      var AuthKey_path = data["AuthKey_path"]
      var apiIssuer = data["apiIssuer"]
      var AuthKey_Name = AuthKey_path.substring(AuthKey_path.lastIndexOf('/')+1);
      var apiKey = AuthKey_Name.substr("AuthKey_".length, 10);
      var cmd=`xcrun altool --upload-app -f \\\"${ipa_path}\\\" -t ios --apiKey ${apiKey} --apiIssuer ${apiIssuer} --verbose`
      const command=`osascript -e 'tell application \"Terminal\" to do script (\"${cmd}\")'`
      const { exec } = require('child_process');
      const child = exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(error);
          }
      });
      child.on("exit", (code) => console.log("Open terminal exit"));
}


function syncAuthKeyfileAction(AuthKey_Path) {
    var fs= require('fs')
    var path = require('path');
    var filename=path.basename(AuthKey_Path)
    const homeDir = os.homedir()
    var privateKeyFile=`${homeDir}/.private_keys/${filename}`
    console.log("privateKeyFile:"+privateKeyFile)  
    if (fs.existsSync(privateKeyFile)) {
      //file exists
      console.log("已存在："+AuthKey_Path);
    }else{
      console.log("不存在,同步拷贝");
      var comd =`cp '${AuthKey_Path}' ~/.private_keys/`;
      run_CmdSilent(comd);
    }
}


function handleIPAAction(ipaPath) {
  const os = require('os');
  const path = require('path')
  var pySPath = `public/checkIPAInfo.py`
  // 发布
  if (process.env.NODE_ENV == "development") {
    console.log("development")
  } else if (process.env.NODE_ENV == "production") {
    console.log("production")
    pySPath = path.join(process.resourcesPath, "public/checkIPAInfo.py");
  }
  console.log("pySPath========" + pySPath)
  const fs = require('fs') 
  try {
    if (fs.existsSync(ipaPath)) {
      //file exists
    }else{
      return
    }
  } catch(err) {
    console.error(err)
  }

var python = require('child_process').spawn('/usr/local/bin/python3',
  [pySPath, ipaPath]);
var outStr = ""
python.stdout.on('data', function(data) {
  var textChunk = data.toString();
  console.log(typeof(textChunk));
  outStr += textChunk;
  // console.log("App_Icon===================")
});

python.stderr.on('data', (data) => {
  // console.error(`stderr=========: ${data}`);
});

python.on('close', function(code) {
  console.error(`close=========: ${code}`);
  var appInfo = JSON.parse(outStr);
  const msgData = {
    "channel": "appInfo",
    "data": appInfo
  }
  sendMsgToRender(msgData)
});
}

//监听渲染进程发来的消息
ipcMain.on('render-send-to-main', (event, msg) => {
    console.log(`receive message from render: ${JSON.stringify(msg)}`)
    const channel = msg["channel"]
    if (channel == "ipa_select") {
      handleIPAAction(msg["data"])
    }else if (channel == "authkey_select") {
      syncAuthKeyfileAction(msg["data"])
    }else if (channel == "startupload_Action") {
      verifyAnUplodAction(msg["data"],true)
    }else if (channel == "verification_Action") {
      verifyAnUplodAction(msg["data"],false)
    }
})


ipcMain.on('openwindow_history', function (event) {
  const winURL = process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080'
    : `file://${__dirname}/index.html`

  let addNewWindow = new BrowserWindow({
      width: 900,
      height: 400,
      parent: win, // win是主窗口
      title:"上传记录",
      webPreferences: {
        contextIsolation: false,
        nodeIntegration: true,// 允许页面集成node模块
        enableRemoteModule:true //打开remote模块
      },
  });

  addNewWindow.on('page-title-updated', function (event,title) {
     event.preventDefault();
  })
  if (!process.env.IS_TEST) addNewWindow.webContents.openDevTools()
  addNewWindow.loadURL(`${winURL}#/history`);
  addNewWindow.on('closed', () => {
    addNewWindow = null;
  });
})

