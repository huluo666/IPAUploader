const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: config => {
    config.externals = {
        'better-sqlite3': 'commonjs better-sqlite3'
    };
  },
  pluginOptions: {
    electronBuilder: {
        nodeIntegration: true,// 允许页面集成node模块
        contextIsolation: false,
        enableRemoteModule:true, //打开remote模块
        externals: [ 'better-sqlite3' ],
        builderOptions: {
          "appId": "com.electron.appupload",
          "productName": "ipa上传",//项目名，也是生成的安装文件名，即aDemo.exe
          "copyright": "Copyright © 2022",//版权信息
          "mac": {
            "icon": "src/assets/icon.png"//这里注意配好图标路径
          },
          "extraResources": "public" //打包资源文件
        },
    }
  }
})