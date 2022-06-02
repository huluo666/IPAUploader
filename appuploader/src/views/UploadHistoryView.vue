<template>
  <!-- 可编辑表格V2 -->
  	<div id="main">
    <!-- 表格 -->
    <el-table
      :data="handlesearch(tableData)"
      style="width: 100%;margin-top:10px"
      @header-contextmenu="(column, event) => rightClick(null, column, event)"
      :row-class-name="tableRowClassName"
    >
      <el-table-column v-if="columnList.length > 0" type="index" :label="'编号'" :width="60"/>
      <el-table-column v-for="(col,idx) in columnList" :key="col.prop" :prop="col.prop" :label="col.label" :index="idx" :width="col.width">
        <template #default="scope">
			<span v-if="scope.row.isSet">
				<el-input size="default" placeholder="请输入内容" v-model="editRow_Data[col.prop]"></el-input>
			</span>
			<span v-else>{{scope.row[col.prop]}}</span>
		</template>
      </el-table-column>
      <el-table-column label="用户编辑">
        <template #header>
          <el-input v-model="search" size="small" placeholder="输入关键词搜索" />
        </template>
        <template #default="scope">
          	<span class="el-tag el-tag--info el-tag--mini" style="cursor: pointer;" @click="handleEditRow(scope.row,scope.$index,true)">
							{{scope.row.isSet?'保存':"修改"}}
						</span>
						<span v-if="!scope.row.isSet" class="el-tag el-tag--danger el-tag--mini" style="cursor: pointer;" @click="deleteRow(scope.row,scope.$index,tableData)">
							删除
						</span>
						<span v-else class="el-tag  el-tag--mini" style="cursor: pointer;" @click="handleEditRow(scope.row,scope.$index)">
							取消
						</span>
        </template>
      </el-table-column>
    </el-table>
    <!-- 单元格/表头内容编辑框 -->
    <div class="el-table-add-row" style="width: 99.2%;">
      <el-button id="adButton" type="" @click=addRow() link style="width:100%">+ 添加</el-button>
    </div>
  </div>
</template>

<script>
import DB from '../datastore'
import ElectronStore from 'electron-store'

export default {
  data(){
    return{
      //表头 
      columnList: [
        { prop: "AuthKey", label: 'API密钥',width: 200 },
        { prop: "Issuer_ID", label: '密钥ID',width: 300},
        { prop: "CFBundleDisplayName", label: 'App名称',width:100},
        { prop: "CFBundleIdentifier", label: 'BundleID',width: 150},
        { prop: "info", label: '备注信息' }
      ],
      tableData: [
        { AuthKey: 'AuthKey_5N6476HV6Y.p8', Issuer_ID: 'fdda0e59-64b0-45df-aa76-437b1e3a46d1', info: '侠客列传'}
      ],
      countCol: 0,                 // 新建列计数
      search: '',
      editRow_index:-1,
      editRow_Data:null
    }
  },
   created:function() {
    console.log("模板渲染前")
     this.reloadLocalData()
  },
  computed: {
  },
  methods: {
    reloadLocalData(){
      console.log("加载本地数据");
      const row=DB.query(`SELECT * FROM HistoryInfoTable`)
      if (row.length>0){
        console.log(row)
        console.log("加载成功")
        row.map(i => {
					i.isSet = false; //给后台返回数据添加`isSet`标识
					console.log("设置编辑标识isSet================"+i)
					return i;
				});
        this.tableData=row;
      }else{
        console.log("未查询到记录,开始保存")
      }
    },
    handlesearch(){
      console.log("筛选数据");
      return this.tableData.filter((data) =>!this.search || data.info.toLowerCase().includes(this.search.toLowerCase()))
    },
    // 编辑
    handleEditRow(row, index, cg) {
        if(this.editRow_index>-1&&this.editRow_index!=index){
          this.$message.warning("请先保存当前编辑项");
          return false
        }

        let that = this
      	//是否是取消操作
				if (!cg) {
					console.log("取消UUID=================="+that.editRow_index)
          that.editRow_index=-1;
					return row.isSet = !row.isSet;
				}
        console.log("开始修改数据======================"+JSON.stringify(row));
        console.log("index======================"+index);
        if (row.isSet) {
          //开始保存-提交 
          row.isSet = false;
          that.$message({type: 'success',message: "保存成功!"});
          that.editRow_index=-1;
          DB.run('UPDATE HistoryInfoTable SET AuthKey =@AuthKey ,Issuer_ID=@Issuer_ID,info=@info WHERE UUID = @UUID',row)
        }else{
          //开始编辑
					row.isSet = true;
          that.editRow_index=index;
          that.editRow_Data=that.tableData[index]
        }
    },
    // 删除行
    deleteRow(row,index,rows) { //删除
      	 this.$confirm('此操作将永久删除该记录, 是否继续?', '提示', {
				           confirmButtonText: '确定',
				           cancelButtonText: '取消',
				           type: 'warning'
				         }).then(() => {
                    console.log("删除行数据======================"+JSON.stringify(row));
                    console.log("删除行数据======================"+row["UUID"]);
                    DB.run('DELETE FROM HistoryInfoTable WHERE UUID = @UUID',row)
                    // //删除数据
                    rows.splice(index, 1);
				            this.$message({type: 'success',message: '删除成功!'});
				         }).catch(() => {
                   	this.$message({type: 'info',message: '已取消删除'});         
				         });
    },
    // 新增行
    addRow() {
      for (let i of this.tableData) {
        if (i.isSet) return this.$message.warning("请先保存当前编辑项");
      }	
      var store = new ElectronStore() // 存储数据
      var localInfo = store.get('IPAInfo')
      var IPAInfo = JSON.parse(localInfo)
      console.log("IPAInfo"+IPAInfo)
      let AuthKey_Name=IPAInfo["AuthKey"];
      let Issuer_ID=IPAInfo["Issuer_ID"];
      // 是否已保存密钥对
      const row=DB.query(`SELECT * FROM HistoryInfoTable where AuthKey='${AuthKey_Name}' and Issuer_ID='${Issuer_ID}'`)
      if (row.length>0){
        let rowDict=row[0]
        console.log(rowDict)
        let uuid=rowDict["UUID"]
          //存在，则更新
        let bunndleID=IPAInfo["CFBundleIdentifier"]||""
        if(bunndleID.length>0){
          let updatData={"UUID":uuid,"CFBundleIdentifier":bunndleID,"CFBundleDisplayName":IPAInfo["CFBundleDisplayName"]||""}
          console.log("已保存:"+updatData)
          DB.run('UPDATE HistoryInfoTable SET CFBundleIdentifier=@CFBundleIdentifier,CFBundleDisplayName=@CFBundleDisplayName WHERE UUID=@UUID',updatData)
          return this.$message.warning("该密钥已保存，已更新");
        }else{
          return this.$message.warning("该密钥已保存，无需重复保存");
        }
      }else{
        console.log("未查询到记录,可以保存")
      }      
      var uuid=DB.UUID()
      var rowData_add={ 
            AuthKey: IPAInfo["AuthKey"],
            Issuer_ID: IPAInfo["Issuer_ID"], 
            CFBundleIdentifier: IPAInfo["CFBundleIdentifier"],
            CFBundleDisplayName: IPAInfo["CFBundleDisplayName"],
            info:DB.currentFormatDate(),
            UUID:uuid,
            isSet:true
       }
      console.log(rowData_add)
      this.tableData.push(rowData_add);
      this.editRow_index=this.tableData.length-1
      this.editRow_Data=this.tableData[this.editRow_index]
      DB.run('INSERT INTO HistoryInfoTable (UUID,AuthKey, Issuer_ID,CFBundleIdentifier,CFBundleDisplayName) VALUES (@UUID,@AuthKey, @Issuer_ID,@CFBundleIdentifier,@CFBundleDisplayName)',rowData_add)
    },
    // 添加表格行下标
    tableRowClassName({row, rowIndex}) {
      row.row_index = rowIndex
    }
  },
}
</script>

<style>
	/* 按钮居中显示 */
	#adButton {
		text-align: center;
		display: block;
		margin: auto;
		color: #1CA4FC;
		/* background-color: #e4788c; */
	}

  .el-table-column{
    background-color: #1CA4FC;
  }

  /* 虚线边框 */
	.el-table-add-row {
		margin-top:5px;
    margin-bottom:5px;
		margin-left: 2.5px;
		width: 100%;
		height: 34px;
		border: 1px dashed #c1c1cd;
		border-radius: 3px;
		cursor: pointer;
		justify-content: center;
		display: flex;
		line-height: 34px;
	}

  .el-tag {
    margin-right: 5px;
  }
</style>