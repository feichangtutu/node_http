# 静态服务搭建
## 创建文件基本目录
www.js 做入口
```javascript
#! /usr/bin/env node
require('../src/index')
```
index.js 项目主要内容
```javascript
let http = require('http')
http.createServer(function(req,res){
  res.end('hello world')
}).listen(3000)
```


## 绑定命令

`npm link`
会绑定`package.json`里`bin`下的命令
```json
{
 "bin": {
    "run-server": "bin/www.js"
  }
}
```
操作结果：run-server会指向www.js,然后执行该文件
```docker
up to date in 0.143s
/usr/local/bin/run-server -> /usr/local/lib/node_modules/http-jyn-static/bin/www.js
/usr/local/lib/node_modules/http-jyn-static -> /Users/jyn/work/study/june/static_server/jyn_server
```
test:
1) 执行 `run-server`，启动服务
2) 浏览器打开localhost://3000  
3) 返回hello world

以上是最基础的服务搭建，但是作为静态服务，需要添加以下功能：
1) 根据命令自动打开指定路径
2) 展示项目目录，根据路径获取文件内容
3) 默认展示指定目录的index.html
4) 辅助功能：提示命令解析实现
5) 辅助功能：DEBUG模块配置
6) 文件缓存 压缩等功能
7) 集成ci
---
## 服务实现
### 实现打开网页后可以将目录下的内容展示给用户,还可以进行对应的点击操作
创建serevr实例
```javascript
class Server{
	constructor(){
	}
	handleRequest(){
		console.log(this)
	}
	start(){
		let server = http.createServer(this.handleRequest.bind(this))// 让this指向当前的server
		console.log(server)
	}
}
let server = new Server()
server.start()
```
添加配置文件config.js:
```javascript
module.exports = {
  port: 3000,
  host: 'localhost',
  dir: process.cwd()
} 
```
`process.cwd()`作用:


处理输入的请求：
```javascript
constructor(){
    this.config = config
}
handleRequest(){
    console.log(this)
}
start(){
    let server = http.createServer(this.handleRequest.bind(this))// 让this指向当前的server
    server.listen(config.port,config.host,()=>{
        console.log(`server start http://${config.host}:${config.port}`)
    })
}
```
运行结果ok：
```javascript
/usr/local/bin/node /Users/jyn/work/study/june/static_server/jyn_server/src/index.js
server start http://localhost:3000
```
基本搭建结束，步入正题：
`let stat = util.promisify(fs.stat);`
1. (promisify)[promisify(https://nodejs.org/dist/latest-v8.x/docs/api/util.html#util_util_promisify_original)
] 方法promise化，之后可应用then, async await
2. (fs.stat)[http://nodejs.cn/api/fs.html#fs_class_fs_stats] 读取文件信息

通过分析
```javascript
let stat = util.promisify(fs.stat);// promisify
let readdir = util.promisify(fs.readdir);
let p = path.join(dir, pathname);
let statObj = await stat(p);

```
statObj.isDirectory() 根据目录类型还有文件类型 进行目录展示

ejs模板
```ejs
<body>
  <h2><%=name%></h2>
  <%arr.forEach(item=>{%>
    <li><a href="<%=item.href%>"><%=item.name%></a></li>
  <%})%>
</body>
```
根据ejs模板渲染数据并返回展示
```javascript
	let str = ejs.render(this.template, {
					name: `Index of ${pathname}`,
					arr: dirs
				});
				res.end(str);

```