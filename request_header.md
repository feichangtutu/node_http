# tcp http---16.http
## tcp的应用
node net 核心模块
## http继承了net模块 -tcp
## websocket继承了net模块 -tcp
用法都类似


### body-parser 原理解析 
根据请求头 Content-Type
```javascript
// server
 req.on('end',function (params) {
    let r = Buffer.concat(arr).toString();
    // body-parser  解析请求，根据不同的格式进行不同的解析
    if (req.headers['content-type'] === 'x-www-form-urlencoded'){
      let querystring = require('querystring');
      r = querystring.parse(r); // a=1&b=2
      console.log(r,1);
    } else if (req.headers['content-type'] === 'application/json'){
      console.log(JSON.parse(r),2);
    } else{
      console.log(r,3);
    }
    res.end('我死了'); // 结束了
  })
```
```javascript
// client 
let opts = {
  host:'localhost',
  port:3000,
  path:'/hello',
  headers:{
    'a':1,
    // 'Content-Type':'x-www-form-urlencoded',// 标准表单格式  a=1&b=2
    'Content-Type':'application/json',
    "Content-Length":7 //模拟的时候需要带上长度，不然客户端会当成没有传递数据
  //    默认情况会自己带上 Content-Length
  }
}
let http = require('http');
// 可以扩展为爬虫？ 模拟请求
let client = http.request(opts,function (res) {
  res.on('data',function (data) {
      console.log(data.toString());
  })
});
// client.end("a=1"); // 表示把请求发出去
client.end("{\"a\":1}"); // 表示把请求发出去
```

### 部分读取
请求头 Range:bytes=0-3
 server 获取头
``` javascript 1.8
 http.createServer(function (req, res) {
    let range = req.headers['range'];
 }）
```
server:
```javascript
let http = require('http');
let fs = require('fs');
let path = require('path');
// 当前要下载的文件的大小
let size = fs.statSync(path.join(__dirname, 'my.txt')).size;
console.log(size);
let server = http.createServer(function (req, res) {
  let range = req.headers['range']; // 0-3
  if (range) {
    // 模拟请求 curl -v --header "Range:bytes=0-3" http://localhost:3000
    let [, start, end] = range.match(/(\d*)-(\d*)/);
    start = start ? Number(start) : 0;
    end = end ? Number(end) : size - 1; // 10个字节 size 10  （0-9）
    res.setHeader('Content-Range', `bytes ${start}-${end}/${size - 1}`);
    fs.createReadStream(path.join(__dirname, 'my.txt'), { start, end }).pipe(res);
  } else {
    // 会把文件的内容写给客户端
    fs.createReadStream(path.join(__dirname, 'my.txt')).pipe(res);//可读流可以通过pipe导到可写流
  }
});
server.listen(3000);
```

client:
```javascript
let opts = {
  host:'localhost',
  port:3000,
  headers:{}
}
let http = require('http');
let start = 0;
let fs = require('fs');
function download() {
  opts.headers.Range = `bytes=${start}-${start+3}`;
  start+=4;
  console.log(`start is ${start}`)
  let client = http.request(opts,function (res) {
      let total = res.headers['content-range'].split('/')[1];
      // console.log(half)
      res.on('data',function (data) {
        fs.appendFileSync('./download1.txt',data);
      });
      res.on('end',function () {
        setTimeout(() => {
          if ((!pause)&&(start < total))
            download();
        }, 1000);
      })
  });
  client.end();
}
download()
```
分段读取添加暂停功能，监听用户输入
```javascript
let pause = false;
process.stdin.on('data',function (data) {
  if (data.toString().includes('p')){
    pause = true
  }else{
    pause = false;
    download()
  }
})
```
分段读取总结：
+ 提高读取速度，多线程并行，分块读取
+ 断点续传

模拟并行下载：
```javascript

let halfFlag = 20
function download() {
  opts.headers.Range = `bytes=${start}-${start+3}`;
  start+=4;
  console.log(`start is ${start}`)
  let client = http.request(opts,function (res) {
      let total = res.headers['content-range'].split('/')[1];
	  let halfFlag = Math.floor(total/2)
      // console.log(half)
      res.on('data',function (data) {
        fs.appendFileSync('./download1.txt',data);
      });
      res.on('end',function () {
        setTimeout(() => {
          if ((!pause)&&(start < halfFlag))
            download();
        }, 1000);
      })
  });
  client.end();
}
let half = halfFlag

function downloadTwo() {
	opts.headers.Range = `bytes=${half}-${half+3}`;
	half+=4;
	console.log(`half is ${half}`)
	let client = http.request(opts,function (res) {
		let total = res.headers['content-range'].split('/')[1];
		res.on('data',function (data) {
			fs.appendFileSync('./download2.txt',data);
		});
		res.on('end',function () {
			setTimeout(() => {
				if (!pause&&half < total)
					downloadTwo();
			}, 1000);
		})
	});
	client.end();
}
download();
downloadTwo();
```
## 爬虫应用
在服务端模拟请求，不存在跨域问题
```javascript
let http = require('http');
let fs = require('fs')
let opts = {
  host:'news.baidu.com',
}
http.createServer(function (req,res) {
  let client = http.request(opts,function (r) {
    let arr= [];
    r.on('data',function (data) {
      arr.push(data);
    });
    r.on('end',function() {
      let result = Buffer.concat(arr).toString();
      console.log(result)
      let lis = result.match(/<li class="bold-item"(?:[\s\S]*?)<\/li>/img);
      res.setHeader('Content-Type','text/html;charset=utf8');
      fs.appendFileSync('./crawl.txt',lis);
      res.end('结束了');
    })
  });
  client.end();
}).listen(3000)
```
curl模拟请求，然后爬虫开始，把爬取的内容放到crawl.txt文件，结束，返回

```docker
➜  July curl -v localhost:3000
* Rebuilt URL to: localhost:3000/
*   Trying 127.0.0.1...
* TCP_NODELAY set
* Connected to localhost (127.0.0.1) port 3000 (#0)
> GET / HTTP/1.1
> Host: localhost:3000
> User-Agent: curl/7.54.0
> Accept: */*
> 
< HTTP/1.1 200 OK
< Content-Type: text/html;charset=utf8
< Date: Wed, 22 Aug 2018 08:46:08 GMT
< Connection: keep-alive
< Content-Length: 9
< 
* Connection #0 to host localhost left intact
结束了%  
```

## crypto
```javascript
let crypto = require('crypto'); 
let str = 'zfpx';
let base = crypto.createHash('md5').update(str).digest('base64');
console.log(base);
// 可以多次调用update方法
let base1 = crypto.createHash('md5').update('zf').update('px').digest('base64');
console.log(base1);
```
多谢update跟一次调用结果一致

```docker

```