var express = require('express');
var fs = require('fs');
var app = express();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var querystring = require('querystring');
var User=require('./db/user.js')
var Article=require('./db/article.js')
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});
/*
//  主页输出 "Hello World"
app.get('/', function (req, res) {
    console.log("主页 GET 请求");
    res.send('Hello GET');
})
*/

function toJSON (data = {}, message = '', status = '', code = '') {
    return { data, message, status, code }
}
//  POST 请求
app.post('/', function (req, res) {
    console.log("主页 POST 请求");
    res.send('Hello POST');
})

//  /del_user 页面响应
app.get('/del_user', function (req, res) {
    console.log("/del_user 响应 DELETE 请求");
    res.send('删除页面');
})
function creatPath() {

}
//  /发布
app.post('/publish', function (req, res) {
    var alldata='';
    req.on('data',function (chunk) {
        alldata+=chunk;
    })
    req.on('end',function () {

        var jsonAlldata=JSON.parse(alldata)
         var newData={
         userId:jsonAlldata.userInfo._id,
         author: jsonAlldata.userInfo.username,
         date1: jsonAlldata.date1,
         date2:jsonAlldata.date2,
         companyName:jsonAlldata.companyName,
         region:jsonAlldata.region,
         desc:jsonAlldata.desc,
         picArr:[],
         publishdate:new Date()
         }
         /*console.log(newData)*/
         var article=new Article(newData)
         article.save(function (err,ress) {
         if(err){
            return res.json(toJSON({},'网络不好，保存失败哟','-1','1'))
         }else{
             var _id=ress._id;
             for(var i=0;i<jsonAlldata.picArr.length;i++){
                 var base64 = jsonAlldata.picArr[i].replace(/^data:image\/\w+;base64,/, "");
                 var dataBuffer = new Buffer(base64, 'base64'); //把base64码转成buffer对象
                 var date=new Date();
                 var filename=String(date.getFullYear())+String(date.getMonth()+1)+String(date.getDate());
                 var path='./img/'+filename+'/';
                 var imgSrc='./img/'+filename+'/'+Date.parse(date)+i+'.png'
                 var imgname=Date.parse(date)+i+'.png';
                 writeToFile(path,i,imgname,imgSrc,dataBuffer,_id,res)
             }

         /*return res.json(toJSON({},'成功','200','0'))*/
            }
         })
        function writeToFile(path,i,imgname,imgSrc,dataBuffer,_id,res) {
            fs.access(path, (err) => {
                if(err){
                    fs.mkdir(path, function(err){
                        if(err){
                            console.log(err);
                        }else{
                            console.log("creat done!");
                            fs.writeFile(imgSrc,dataBuffer,function(err){//用fs写入文件
                                if(err){
                                    console.log(err);
                                }else{
                                    console.log('写入成功！');
                                }
                            })
                        }
                        console.log("不存在")
                    })
                }else{
                    fs.writeFile(imgSrc,dataBuffer,function(err){//用fs写入文件
                        if(err){
                            console.log(err);
                        }else{
                            jsonAlldata.picArr[i]='https://only1314.cn/upload/'+imgname;
                            var wherestr = {'_id' : _id};
                            var updatestr = {'picArr': jsonAlldata.picArr};
                            Article.update(wherestr, updatestr, function(err, resss){
                                if (err) {
                                    console.log("Error:" + err);
                                }
                                else {
                                    return res.json(toJSON({},'成功','200','0'))
                                }
                            })
                        }
                    })
                    console.log(err ? 'no access!' : 'can read/write');
                }

            });

        }

       /* var newData={
            userId:jsonAlldata.userInfo._id,
            author: jsonAlldata.userInfo.username,
            date1: jsonAlldata.date1,
            date2:jsonAlldata.date2,
            companyName:jsonAlldata.companyName,
            region:jsonAlldata.region,
            desc:jsonAlldata.desc,
            picArr:jsonAlldata.picArr,
            publishdate:new Date()
        }
        console.log(newData)
        var article=new Article(newData)
        article.save(function (err,ress) {
            if(err){
                return res.json(toJSON({},'网络不好，保存失败哟','-1','1'))
            }else{
                return res.json(toJSON({},'成功','200','0'))
            }
        })*/
    })
})
//  /获取文章列表
app.post('/getArticleList', function (req, res) {
    var alldata='';
    req.on('data',function (chunk) {
        alldata+=chunk;
    })
    req.on('end',function () {
        var pageSize = 5;                   //一页多少条
        var currentPage = 1;                //当前第几页
        var sort = {'publishdate':-1};        //排序（按登录时间倒序）
        var condition = {};                 //条件
        var skipnum = (currentPage - 1) * pageSize;   //跳过数
        Article.find(condition).skip(skipnum).limit(pageSize).sort(sort).exec(function (err, ress) {
            if (err) {
                console.log("Error:" + err);
            }
            else {
                console.log("返回",ress)
                if(ress!=''){
                    console.log("找到了")
                    return res.json(toJSON(ress,'成功','200','0'))
                }else{
                    console.log('没找到')
                    return res.json(toJSON({},'用户名或密码错误','-1','1'))
                }
            }
        })
    })
})
// 注册
app.post('/regist', function (req, res) {
    var alldata='';
    req.on('data',function (chunk) {
        alldata+=chunk;
    })
    req.on('end',function () {
        console.log(alldata);
        console.log(typeof alldata)
        var jsonAlldata=JSON.parse(alldata)
        console.log(typeof  jsonAlldata)
        console.log(jsonAlldata)
        var user=new User({
            username:jsonAlldata.username,
            userpwd:jsonAlldata.password,
            userage:24,
            logindate:new Date()
        })
        user.save(function (err,res) {
            if(err){
                console.log("Error")
            }else{
                console.log("yew")
            }
        })
        res.write(alldata)
        res.end();
    })
})
// 登陆
app.post('/login', function (req, res) {
    var alldata='';
    req.on('data',function (chunk) {
        alldata+=chunk;
    })
    req.on('end',function () {
        var jsonAlldata=JSON.parse(alldata)
        var wherestr = {'username' : jsonAlldata.username};
        User.find(wherestr, function(err, ress){
            if (err) {
                console.log("Error:" + err);
            }
            else {
                console.log("返回",ress)
                if(ress!=''&&ress[0].userpwd==jsonAlldata.password){
                    console.log("找到了")
                    return res.json(toJSON(ress[0],'成功','200','0'))
                }else{
                    console.log('没找到')
                    return res.json(toJSON({},'用户名或密码错误','-1','1'))
                }
            }
        })
    })
})
// 文件上传
app.post('/fileload',  multipartMiddleware,function (req, res) {
    console.log("dwdew", req.files)
    var source = fs.createReadStream(req.files.file.path);
    var date=new Date()
    var filename=String(date.getFullYear())+String(date.getMonth()+1)+String(date.getDate())
    var path='./img/'+filename+'/'
})
//  /list_user 页面 GET 请求
app.get('/list_user', function (req, res) {
    console.log("/list_user GET 请求");
    res.send('用户列表页面');
})

// 对页面 abcd, abxcd, ab123cd, 等响应 GET 请求
app.get('/ab*cd', function(req, res) {
    console.log("/ab*cd GET 请求");
    res.send('正则匹配');
})


var server = app.listen(8081, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("应用实例，访问地址为 http://%s:%s", host, port)

})