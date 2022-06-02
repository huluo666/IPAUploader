<template>
  <el-row>
    <!-- 左侧 -->
    <el-col :span="19">
      <div class="leftSide">
        <el-form label-width="80px" size="default" style="margin-top:0px;">
          <el-form-item label="IPA文件:" class="formlabel">
            <el-input size="large" placeholder="请输入IPA文件地址(eg:~/Desktop/山海与妖灵0418Dev.ipa)" v-model="inputDirPath">
              <template #append>
                <el-button type="" @click=showFileDialog_selectIPA() link style="width:80px">选择文件</el-button>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="API密钥:" class="formlabel">
            <el-input size="large" v-model="AuthKey_Path" placeholder="请输入密钥文件地址(eg:~/.private_keys/AuthKey_546VBKYA87.p8)">
              <template #append>
                <el-button type="" @click=showFileDialog_selectAuthKey() link style="width:80px">选择文件</el-button>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item size="large" label="密钥ID:" class="formlabel">
            <el-input v-model="Issuer_ID" placeholder="请输入issuser id" />
          </el-form-item>
        </el-form>

        <el-row :gutter="20" style="margin-top: 30px;">
          <el-col :span="12">
            <div class="grid-content bg-purple">
              <el-button type="primary" size="large" id="uploadBtn" @click="startUpload(true)">开始上传</el-button>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="grid-content bg-purple">
              <el-button type="success" size="large" id="validateBtn" @click="startUpload(false)">验证IPA</el-button>
            </div>
          </el-col>
        </el-row>
      </div>

    </el-col>

    <!-- 右侧 -->
    <el-col :span="5">
      <div class="rightSide">
        <div class="smallImage">
          <el-image class="AppIcon_Class" @click=clickAppInfo() :src="AppIcon" />
          <el-drawer
              v-model="visible"
              title="应用信息"
              direction="rtl"
              size="40%"
            >
            <AppInfoPage :IPAInfo="IPAInfo"></AppInfoPage>
          </el-drawer>
        </div>

        <div class="btn_item">
          <el-button type="info" @click=clickHelp() round>使用帮助</el-button>
        </div>
        <div class="btn_item">
          <el-button type="success" @click=clickHistory() round>历史记录</el-button>
        </div>
      </div>
    </el-col>
  </el-row>
</template>


<script>
  import {ipcRenderer,shell,clipboard} from 'electron'
  import ElectronStore from 'electron-store'
	import AppInfoPage from './AppInfoPageView.vue'

  function isEmpty(obj) {
    if (typeof obj == "undefined" || obj == null || obj == "") {
      return true;
    } else {
      return false;
    }
  };

  export default {
    components: {
      AppInfoPage
    },
    data() {
      const os = require('os')
      const homeDir = os.homedir()
      console.log("__dirname:" + homeDir)
      let fs = require('fs');
      var AppIconPath = `${__static}/defaultIcon.png`
      var iconData=fs.readFileSync(AppIconPath)
      var appiconData=iconData.toString('base64')
      console.log("AppIconPath:" + AppIconPath)
      const store = new ElectronStore();
      let lastInfo=store.get('Last_IPAInfo')
      console.log("历史记录===:"+lastInfo)
      if (typeof lastInfo !== "undefined" && lastInfo !== null){
        lastInfo = JSON.parse(lastInfo)
      }else{
	       lastInfo={}
      }

      return {
        AppTitle: 'IPA上传工具',
        appversion: '1.0.0',
        inputDirPath: lastInfo["ipa_path"]||"",
        AuthKey_Path: lastInfo["AuthKey_path"]||"",
        Issuer_ID: lastInfo["apiIssuer"]||"",
        App_Icon: "",
        url: 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg',
        // imageUrl: '',
        CFBundleDisplayName: '',
        Version: "",
        Build: '',
        BundleId: "",
        MinimumOSVersion: '1.0',
        visible: false,
        IPAInfo: "我是父组件给的msg",
        AppIcon:'data:image/jpeg;base64,'+appiconData,
        table:false
      }
    },
    mounted() {
      //解析ipa信息
      this.handleIpaInfo();
      let that = this
      //监听
      ipcRenderer.on('main-send-to-render', (event, msg) => {
        const channel = msg["channel"]
        console.log('渲染进程收到的消息:', msg)
        const data = msg["data"]
        if (channel == "error") {
            this.$message.error(data["title"]);
        }else if (channel == "success") {
          	this.$message({type: 'success',message: data["title"]});
        }else if (channel == "appInfo") {
          // console.log(data)
          let appInfo=data;
          var base64Data = appInfo["AppIconBase64"];
          console.log(appInfo)
          that.AppIcon='data:image/png;base64,'+base64Data;
          that.CFBundleDisplayName=appInfo["CFBundleDisplayName"];
          that.BundleId=appInfo["CFBundleIdentifier"];
          that.Version=appInfo["CFBundleVersion"];
          that.MinimumOSVersion=appInfo["MinimumOSVersion"];
          that.Build=appInfo["CFBundleShortVersionString"];

          let appInfoDict={
          	"AppIcon":that.AppIcon,
          	"AuthKey":that.AuthKey_Path,
          	"Issuer_ID":this.Issuer_ID,
          	"CFBundleDisplayName":that.CFBundleDisplayName,
          	"CFBundleIdentifier":that.BundleId,
          	"CFBundleVersion":that.Version,
          	"MinimumOSVersion":that.MinimumOSVersion,
          	"CFBundleShortVersionString":that.Build
          }
          that.IPAInfo=appInfoDict;
        }
      });

      ipcRenderer.on('asynchronous-reply', (event, arg) => {
        if (arg === 0 || arg === 1) {
          console.log("=======空========");
          return
        }
        console.log("PING:" + arg);
      })
    },
    methods: {
      open(link) {
        this.$electron.shell.openExternal(link)
      },
      handleIpaInfo() {
         //解析ipa icon
        const msgData = {
        "channel": "ipa_select",
        "data": this.$data.inputDirPath 
         }
      ipcRenderer.send('render-send-to-main', msgData)
      },

      //验证密钥是否合法
      startValidate() {
        ipcRenderer.send('do-unpack', this.AuthKey_Path ? '' : this.Issuer_ID)
      },
      //开始上传ipa
      startUpload(isUpload) {
        console.log("startUpload:" + this.AuthKey_Path);
        var AuthKey_path = this.AuthKey_Path
        var ipa_path = this.inputDirPath;
        var apiIssuer = this.Issuer_ID;

        if (isEmpty(ipa_path)) {
          this.$message.error('请输入ipa文件地址');
          return;
        }

        console.log(apiIssuer.length)
        if (isEmpty(apiIssuer) || apiIssuer.length != 36) {
          this.$message.error("请输入正确密钥ID")
          return;
        }
        if (isEmpty(AuthKey_path)) {
          this.$message.error("请输入密钥地址")
          return;
        }

        const msgData = {
          "channel": isUpload?"startupload_Action":"verification_Action",
          "data": {
            "ipa_path": ipa_path,
            "AuthKey_path": AuthKey_path,
            "apiIssuer": apiIssuer,
            "CFBundleIdentifier":this.BundleId,
            "CFBundleDisplayName":this.CFBundleDisplayName
          }
        }

        const store = new ElectronStore();
        store.set('Last_IPAInfo',JSON.stringify(msgData["data"]));
        ipcRenderer.send('render-send-to-main', msgData)
      },
      // 显示目录选择器---选取IPA文件
      showFileDialog_selectIPA() {
        console.log("window=====:"+window);
        const {remote} = window.require('electron')
        console.log(remote)
        remote.dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [{
            name: 'IPAType',
            extensions: ['ipa']
          }]
        }).then(result => {
          console.log(result.canceled)
          if (result.canceled) {
            console.log("取消选择")
          } else {
            console.log(result.filePaths)
            this.$data.inputDirPath = result.filePaths[0]
            const msgData = {
              "channel": "ipa_select",
              "data": result.filePaths[0]
            }
            ipcRenderer.send('render-send-to-main', msgData)
          }
        }).catch(err => {
          console.log(err)
        })
      },
      // 显示AuthKey目录选择器
      showFileDialog_selectAuthKey() {
        const dialog = require('electron').remote.dialog
        const os = require('os')
        const homeDir = os.homedir()
        const homeDocDir = `${homeDir}/.private_keys`
        dialog.showOpenDialog({
          defaultPath: homeDocDir,
          properties: ['openFile'],
          filters: [{
            name: 'IPAType',
            extensions: ['p8']
          }]
        }).then(result => {
          console.log(result.canceled)
          if (result.canceled) {
            console.log("取消选择")
          } else {
            console.log(result.filePaths)
            this.$data.AuthKey_Path = result.filePaths[0]
            const msgData = {
              "channel": "authkey_select",
              "data": this.$data.AuthKey_Path
            }
            ipcRenderer.send('render-send-to-main', msgData)
          }
        }).catch(err => {
          console.log(err)
        })
      },
      clickAppInfo() {
        this.visible = !this.visible;
      },
      clickHelp() {
        // Or in the renderer process.
        const BrowserWindow = require('electron').remote.BrowserWindow;
        const path = require('path')
        const url = require('url')

        var win = new BrowserWindow({
          width: 800,
          height: 600,
          show: false
        });
        win.on('closed', function() {
          win = null;
        });

        var apphelppath = `file://${__static}/AppHelp.html`
        console.log(apphelppath)
        win.loadURL(apphelppath);
        // file:///Users/jenkins/DevelopFolder/Electron/AppUploader/static/AppHelp.html
        win.show();
      },
      clickHistory() {
        //保存ipa路径
        //截取apiKey
        var AuthObj = this.AuthKey_Path.lastIndexOf("/");
        var apiKey = this.AuthKey_Path.substr(AuthObj + 1);
        let rowData={ 
              AuthKey: apiKey,
              Issuer_ID: this.Issuer_ID, 
              CFBundleIdentifier: this.BundleId,
              CFBundleDisplayName: this.CFBundleDisplayName,
              IPAPath:this.inputDirPath
        }
        const store = new ElectronStore();
        store.set('IPAInfo',JSON.stringify(rowData));
        const ipc = require('electron').ipcRenderer;
        ipc.send('openwindow_history')
      }
    }
  }
</script>


<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
  .leftSide {
    text-align: left;
    margin-left: 0px;
    margin-top: 20px;
    /* background-color: #FAEBD7; */
    /* width: 100%; */
  }

  .rightSide {
    margin-top: 20px;
    margin-left: 10px;
    /* width: 100%; */
    /* background-color: aqua; */
  }

  .el-form-item--default.el-form-item,
  .el-form-item--small.el-form-item {
    margin-bottom: 15px;
    /* background: green; */
  }

  .el-form-item__label {
      font-size: 14px;
      font-weight: bold;
      color: gray;
  }
  /* 按钮居中显示 */
  #uploadBtn,#validateBtn {
  	/* text-align: center; */
  	display: block;
  	margin: auto;
  	/* background-color: #b0e0e6; */
  }

  .AppIcon_Class {
    width: 90%;
    height:90%;
  	border-radius: 10px;
    background-color:transparent;
  }

  .btn_item {
    display: block;
  	margin: auto;
    margin-top: 15px;
  }

</style>
