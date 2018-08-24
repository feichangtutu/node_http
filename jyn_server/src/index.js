let http = require('http');
let util = require('util');
let url = require('url');
let zlib = require('zlib');
let fs = require('fs');
let path = require('path');

let ejs = require('ejs'); // 模板引擎
let template = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');

let chalk = require('chalk'); // 粉笔 改变命令行颜色
let mime = require('mime');   // 类型模块 第三方
let debug = require('debug')
let config = require('./config')
let stat = util.promisify(fs.stat);// promisify
let readdir = util.promisify(fs.readdir);

class Server{
	constructor(command){
		this.config = { ...config, ...command};
		this.template = template;
	}
	async handleRequest(req, res){
		let {dir} = this.config
		let {pathname} = url.parse(req.url)
		if (pathname === '/favicon.ico') return res.end();//处理favicon请求
		let p = path.join(dir, pathname);
		// let p = path.join(__dirname,'..',dir,pathname)
		try {
			// 判断当前路径是文件 还是文件夹
			let statObj = await stat(p);
			console.log(statObj)
			if (statObj.isDirectory()) {
				// 读取当前访问的目录下的所有内容 readdir 数组 把数组渲染回页面
				res.setHeader('Content-Type', 'text/html;charset=utf8')
				let dirs = await readdir(p);
				dirs = dirs.map(item=>({
					name:item,
					// 因为点击第二层时 需要带上第一层的路径，所有拼接上就ok了
					href:path.join(pathname,item)
				}))
				console.log(dirs,'dirs')
				//[ { name: 'a', href: '/a' },
				// { name: 'test.txt', href: '/test.txt' },
				// { name: 'index.css', href: '/index.css' },
				// { name: 'index.html', href: '/index.html' } ]
				
				// ejs模板渲染出文件目录展示
				let str = ejs.render(this.template, {
					name: `Index of ${pathname}`,
					arr: dirs
				});
				res.end(str);
			} else {
				this.sendFile(req, res, statObj, p);
			}
		} catch (e) {
			debug(e); // 发送错误
			this.sendError(req, res);
		}
		
		console.log(pathname)
		console.log(this)
	}
	sendError(req, res) {
		res.statusCode = 404;
		res.end(`Not found`);
		this.start();
	}
	sendFile(req, res, statObj, p) {
		// 设置缓存，如果文件以及打开过了 要下一次多少秒内不要再次访问了
		// 下次再访问服务器的时候 要使用对比缓存
		// if (this.cache(req, res, statObj, p)){
		// 	res.statusCode = 304;
		// 	return res.end();
		// }
		// if (this.range(req, res, statObj, p)) return
		res.setHeader('Content-Type', mime.getType(p) + ';charset=utf8');
		// let transform = this.gzip(req, res, statObj, p)
		// if (transform){ // 返回一个压缩后的压缩流
		// 	return fs.createReadStream(p).pipe(transform).pipe(res);
		// }
		fs.createReadStream(p).pipe(res);
	}
	start(){
		let server = http.createServer(this.handleRequest.bind(this))// 让this指向当前的server
		server.listen(this.config.port,this.config.host,()=>{
			console.log(`server start http://${this.config.host}:${this.config.port}`)
		})
	}
}
module.exports = Server