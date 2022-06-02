// http://www.siwei.me/blog/posts/electron-electron-vue-sqlite3-sqlite-db-run-exec
import path from 'path';
import { remote } from 'electron';

const sqlite = require("better-sqlite3");
const os = require("os");

const fpath = path.join(os.homedir(), '/.private_keys/database.db')
const db = new sqlite(fpath, { fileMustExist: true });
// const db = new sqlite(path.resolve(__dirname, 'cicd.db'), {fileMustExist: true});

const create_table_history=
    `CREATE TABLE IF NOT EXISTS HistoryInfoTable(
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      UUID       TEXT   NOT NULL,
      AuthKey    TEXT   NOT NULL,
      Issuer_ID  TEXT  NOT NULL,
      CFBundleIdentifier  TEXT,
      CFBundleDisplayName  TEXT,
      info	TEXT
    );`
db.exec(create_table_history)//执行sql命令

//query查询记录：
const query = (sql) => {
  return db.prepare(sql).all();
}

const queryAll = (sql, params) => {
  return db.prepare(sql).all(params);
}

function querywithparams(sql, params) {
  return db.prepare(sql).all(params);
}


const params = (sql, params) => {
  return db.prepare(sql).get(params); // return a single row with params
}

// 更新记录、删除记录
const run = (sql, params) => {
  return db.prepare(sql).run(params);
}


// https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
function UUID() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (d + Math.random()*16)%16 | 0;
    d = Math.floor(d/16);
    return (c=='x' ? r : (r&0x3|0x8)).toString(16);
  });
  return uuid;
};


// 获取系统当前时间并格式化
//  @returns yyyy-MM-dd HH:mm:ss
function currentFormatDate() {
    // 系统当前时间格式化
    var currentFormatDate = "";
    // 获取系统当前日期
    var date = new Date();
    // 获取当前年
    var currentYear = date.getFullYear();
    // 获取当前月
    var currentMonth = date.getMonth() + 1;
    currentMonth = (currentMonth <= 9)?"0" + currentMonth:currentMonth;
    // 获取当前日
    var currentDay = date.getDate();
    currentDay = (currentDay <= 9)?"0" + currentDay:currentDay;
    // 时
    var currentHours = date.getHours();
    // 分
    var currentMinutes = date.getMinutes();
    // 秒
    var currentSeconds = date.getSeconds();
    // yyyy-MM-dd HH:mm:ss
    currentFormatDate = currentYear + "-" + currentMonth + "-" + currentDay + " " + currentHours + ":" + currentMinutes
            + ":" + currentSeconds;
    return currentFormatDate;
}



const dbConfig = {
    query,
    queryAll,
    querywithparams,
    run,
    params,
    UUID,
    currentFormatDate
}





export default dbConfig


/**
  使用const db = require("./database.js")
  var rows = db.querywithparams(sql, params)
  if (!rows.length) {
    res.send(404)
  } else {
    res.json(rows[0])
  }
 */
