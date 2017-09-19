var express = require('express');
var fs = require('fs');
var app = express();
/*var multipart = require('connect-multiparty');
 var multipartMiddleware = multipart();*/
var querystring = require('querystring');
var crypto = require('crypto');
var User = require('./db/user.js')
var Article = require('./db/article.js')
var Comments = require('./db/comments.js')
var send = require('./email/email.js');
var formidable = require('formidable');
var node_xlsx = require('node-xlsx');
/*var Hash = require('./db/hashcode.js')*/
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

function toJSON(data = {}, message = '', status = '', code = '') {
    return {data, message, status, code}
}
function copyFile(oldPath,newPath){
    console.log('--------开始读取文件--------');
    fs.readFile(oldPath, function(err, data) {
        if (err) {
            console.log("读取失败");
        } else {
            fs.writeFile(newPath,data,function(error){
                if(error){
                    throw error;
                }else{
                    console.log("文件已保存");
                }
            });
        }
    });
/*    readable = fs.createReadStream( oldPath );
    // 创建写入流
    writable = fs.createWriteStream( newPath );
    readable.pipe( writable );*/
}
function compare(property){
    return function(obj1,obj2){
        var value1 = obj1[property];
        var value2 = obj2[property];
        return value1 - value2;     // 升序
    }
}
function comparef(property){
    return function(obj1,obj2){
        var value1 = obj1[property];
        var value2 = obj2[property];
        return value2 - value1;     // 降序
    }
}
//  POST 请求
app.post('/', function (req, res) {
    console.log("主页 POST 请求");
    res.send('Hello POST');
})

//对excel文件进行解析，读取数据
var ExcelParse = function (newPath,username,userId,res) {
    var obj = node_xlsx.parse(newPath);
    var excelObj = obj[0].data;//取得第一个excel表的数据
     //循环遍历表每一行的数据
    console.log("条数",excelObj.length)
     for(var i=0;i<excelObj.length-1;i++) {
         var rdata = excelObj[i];
             var newData = {
                 userId: userId,
                 author: username,
                 date1: '',
                 date2: '',
                 companyName:  rdata[0],
                 address:rdata[1]||'暂无',
                 region: '互联网',
                 desc: rdata[2],
                 picArr: 'https://only1314.cn/static/images/s.jpg',
                 publishdate: new Date(),
                 replyNums: 0,
                 likeNums: 0,
                 remark:'此为批量导入，信息由19652站提供，在此，十分感谢',
                 comments: []
             }
             var article = new Article(newData)
             article.save(function (err, ress) {
                 if (err) {
                     return res.json(toJSON({}, '网络不好，保存失败哟', '-1', '1'))
                 } else {

                     /*return res.json(toJSON({}, '成功', '200', '0'))*/
                 }
             })
     }
}
// 批量导入文章=================发布需要修改路径
app.post('/excelArticle', function (req, res) {
    var form = new formidable.IncomingForm();
    form.uploadDir='../usr/share/nginx/html/upload/article/';
    /*form.uploadDir='./public/upload/article/';*/
   /* var path='./public/upload/article/'*/
    var path='../usr/share/nginx/html/upload/article/'
    form.parse(req, function (err, fields, files) {
             if (err) {
         console.log('文件上传错误！');
         return;
         }
        var filename=files.Filedata.name;
         // 对文件名进行处理，以应对上传同名文件的情况
         var nameArray = filename.split('.');
         var type = nameArray[nameArray.length - 1];
         var name = '';
         for (var i = 0; i < nameArray.length - 1; i++) {
         name = name + nameArray[i];
         }
         var date = new Date();
         var time = '_' + date.getFullYear() + "_" + date.getMonth() + "_" + date.getDay() + "_" + date.getHours() + "_" + date.getMinutes();

         var avatarName = name + time + '.' + type;

         var newPath = path + avatarName;
         console.log(newPath);
         fs.renameSync(files.Filedata.path, newPath);  //重命名
         console.log('重命名成功！');
         //对excel文件进行解析读取数据
        /* var newPath = path + files.Filedata.name;*/
         ExcelParse(newPath,fields.username,fields.userId,res);
    })
})
//  /发布----------------------------------------------发布前修改路径
app.post('/publish', function (req, res) {
    var alldata = '';
    req.on('data', function (chunk) {
        alldata += chunk;
    })
    req.on('end', function () {
        var jsonAlldata = JSON.parse(alldata)
        if (jsonAlldata.picArr == '') {
            var newData = {
                userId: jsonAlldata.userInfo._id,
                author: jsonAlldata.userInfo.username,
                date1: jsonAlldata.date1,
                date2: jsonAlldata.date2,
                companyName: jsonAlldata.companyName,
                address:jsonAlldata.address||'暂无',
                region: jsonAlldata.region,
                desc: jsonAlldata.desc,
                picArr: jsonAlldata.picArr,
                publishdate: new Date(),
                replyNums: 0,
                likeNums: 0,
                remark: jsonAlldata.remark || ''
               /* comments: []*/
            }
            console.log(newData)
            var article = new Article(newData)
            article.save(function (err, ress) {
                if (err) {
                    return res.json(toJSON({}, '网络不好，保存失败哟', '-1', '1'))
                } else {
                    return res.json(toJSON({}, '成功', '200', '0'))
                }
            })
        } else {
            for (var i = 0; i < jsonAlldata.picArr.length; i++) {
                var base64 = jsonAlldata.picArr[i].replace(/^data:image\/\w+;base64,/, "");
                var dataBuffer = new Buffer(base64, 'base64'); //把base64码转成buffer对象
                var date = new Date();
                var filename = String(date.getFullYear()) + String(date.getMonth() + 1) + String(date.getDate());
                 var path = '../usr/share/nginx/html/images/Article/' + filename + '/';
                 var imgSrc = '../usr/share/nginx/html/images/Article/' + filename + '/' + Date.parse(date) + i + '.png'
               /* var path = './img/' + filename + '/';
                var imgSrc = './img/' + filename + '/' + Date.parse(date) + i + '.png'*/

                var imgname = String(Date.parse(date)) + String(i) + '.png';
                try {
                    writeToFile(i, imgSrc, imgname, filename, dataBuffer, jsonAlldata, res)
                } catch (err) {
                    fs.mkdirSync(path)
                    writeToFile(i, imgSrc, imgname, filename, dataBuffer, jsonAlldata, res)
                }

            }
        }

    })
})
//用户中心，发布前需要改路径
app.post('/userCenter',function (req,res) {
    var alldata = '';
    req.on('data', function (chunk) {
        alldata += chunk;
    })
    req.on('end', function () {
        var jsonAlldata = JSON.parse(alldata);
        if(jsonAlldata.type=='switchPhoto'){
            var userPhoto=jsonAlldata.picArr[0];
            var uid=jsonAlldata.uid;
            var pic=jsonAlldata.pic;
            var base64 = userPhoto.replace(/^data:image\/\w+;base64,/, "");
            var dataBuffer = new Buffer(base64, 'base64'); //把base64码转成buffer对象
            var date = new Date();
            var filename = String(date.getFullYear()) + String(date.getMonth() + 1) + String(date.getDate());
            var imgSrc = '../usr/share/nginx/html/'+pic;
          /*  var path = './img/photo/' + filename + '/';
            var imgSrc = './img/photo/' + filename + '/' + Date.parse(date)+ '.png'*/
            fs.writeFileSync(imgSrc, dataBuffer)
            var findUser={'_id':uid}
            User.find(findUser, function (err, res_user) {
                if (err) {
                    console.log("Error:" + err);
                }
                else {
                    if (res_user != '') {
                        return res.json(toJSON(res_user[0], '成功', '200', '0'))
                    } else {
                        console.log('没找到')
                        return res.json(toJSON({}, '用户不存在', '-1', '1'))
                    }
                }
            })

        }

    })
})
function writeToFile(i, imgSrc, imgname, filename, dataBuffer, jsonAlldata, res) {
    fs.writeFileSync(imgSrc, dataBuffer)
    jsonAlldata.picArr[i] = 'https://only1314.cn/images/Article/' + filename + '/' + imgname;
    /*  var wherestr = {'_id' : _id};
     var updatestr = {'picArr': jsonAlldata.picArr};
     Article.update(wherestr, updatestr, function(err, resss){
     if (err) {
     console.log("Error:" + err);
     }
     else {
     return res.json(toJSON({},'成功','200','0'))
     }
     })*/
    console.log(i, jsonAlldata.picArr.length)
    if (i == jsonAlldata.picArr.length - 1) {
        var newData = {
            userId: jsonAlldata.userInfo._id,
            author: jsonAlldata.userInfo.username,
            date1: jsonAlldata.date1,
            date2: jsonAlldata.date2,
            companyName: jsonAlldata.companyName,
            address:jsonAlldata.address||'暂无',
            region: jsonAlldata.region,
            desc: jsonAlldata.desc,
            picArr: jsonAlldata.picArr,
            publishdate: new Date(),
            replyNums: 0,
            likeNums: 0,
            remark: jsonAlldata.remark || ''
           /* comments: []*/

        }
        console.log(newData)
        var article = new Article(newData)
        article.save(function (err, ress) {
            if (err) {
                return res.json(toJSON({}, '网络不好，保存失败哟', '-1', '1'))
            } else {
                return res.json(toJSON({}, '成功', '200', '0'))
            }
        })
    }
}
//  /获取文章列表
app.post('/getArticleList', function (req, res) {
    var alldata = '';
    req.on('data', function (chunk) {
        alldata += chunk;
    })
    req.on('end', function () {
        var pageSize = 5;                   //一页多少条
        var currentPage = 1;                //当前第几页
        var sort = {'publishdate': -1};        //排序（按登录时间倒序）
        var condition = {};                 //条件
        var skipnum = (currentPage - 1) * pageSize;   //跳过数
        Article.find(condition).skip(skipnum).limit(pageSize).sort(sort).exec(function (err, ress) {
            if (err) {
                console.log("Error:" + err);
            }
            else {
                var ress=ress;
                if (ress != '') {
                    var total=1
                    var articles=[];
                    for(let i=0;i<ress.length;i++){
                        var findUser={'_id':ress[i].userId}
                        User.find(findUser, function (err, res_user) {
                            if (err) {
                                console.log("Error:" + err);
                            }
                            else {

                                var data={
                                    address:ress[i].address,
                                    author:ress[i].username,
                                    userPhoto:res_user[0].userPhoto,
                                    date1:ress[i].date1,
                                    date2:ress[i].date2,
                                    desc:ress[i].desc,
                                    likeNums:ress[i].likeNums,
                                    picArr:ress[i].picArr,
                                    publishdate:ress[i].publishdate,
                                    region:ress[i].region,
                                    remark:ress[i].remark,
                                    replyNums:ress[i].replyNums,
                                    userId:ress[i].userId,
                                    _id:ress[i]._id,
                                    companyName:ress[i].companyName
                                }
                                articles.push(data)
                                    if(total==ress.length){
                                        var sortObj = articles.sort(comparef("publishdate"));
                                        return res.json(toJSON(sortObj, '成功', '200', '0'))
                                    }
                                    total++
                            }
                        })

                    }
                   /* console.log("找到了")
                    return res.json(toJSON(ress, '成功', '200', '0'))*/
                } else {
                    console.log('没找到')
                    return res.json(toJSON({}, '用户名或密码错误', '-1', '1'))
                }
            }
        })
    })
})
// 获取具体文章
app.post('/getArticle',function (req,res) {
    var alldata = '';
    req.on('data', function (chunk) {
        alldata += chunk;
    })
    req.on('end', function () {
        var jsonAlldata = JSON.parse(alldata)
        var wherestr = {'_id': jsonAlldata.aid};
        Article.find(wherestr, function (err, ress) {
            if (err) {
                console.log("Error:" + err);
            }
            else {
                if (ress != '') {
                    console.log("找到文章了")
                    return res.json(toJSON(ress[0], '成功', '200', '0'))
                } else {
                    console.log('没找到')
                    return res.json(toJSON({}, '文章不存在', '-1', '1'))
                }
            }
        })
    })
})
// 文章回复数量统计
app.post('/addReplyNum',function (req,res) {
    var alldata = '';
    req.on('data', function (chunk) {
        alldata += chunk;
    })
    req.on('end', function(){
        var jsonAlldata = JSON.parse(alldata)
        var findArticle={'_id':jsonAlldata.aid}
        Article.find(findArticle, function (err, ress) {
            if (err) {
                console.log("Error:" + err);
            }
            else {
                console.log("返回", ress)
                if (ress != '') {
                    var replyNums=ress[0].replyNums+1;
                    Article.update({'_id': jsonAlldata.aid}, {'replyNums': replyNums}, function (err, resss) {
                        if (err) {
                            console.log("Error:" + err);
                        }
                        else {
                            return res.json(toJSON({}, '回复成功', '200', '0'))
                        }
                    })

                } else {
                    console.log('没找到')
                    return res.json(toJSON({}, 'token错误', '-1', '1'))
                }
            }
        })
    })
})
// 文章点赞
app.post('/addLike',function (req,res) {
    var alldata = '';
    req.on('data', function (chunk) {
        alldata += chunk;
    })
    req.on('end', function(){
        var jsonAlldata = JSON.parse(alldata)
        var findArticle={'_id':jsonAlldata.aid}
        Article.find(findArticle, function (err, ress) {
            if (err) {
                console.log("Error:" + err);
            }
            else {
                console.log("返回", ress)
                if (ress != '') {
                    var likeNums=ress[0].likeNums+1;
                    console.log("数量",ress[0].likeNums,likeNums)
                    Article.update({'_id': jsonAlldata.aid}, {'likeNums': likeNums}, function (err, resss) {
                        if (err) {
                            console.log("Error:" + err);
                        }
                        else {
                            return res.json(toJSON({}, '点赞成功', '200', '0'))
                        }
                    })

                } else {
                    console.log('没找到')
                    return res.json(toJSON({}, 'token错误', '-1', '1'))
                }
            }
        })
    })
})
// 根据文章id获取评论
app.post('/getComments',function (req,res) {
    var alldata = '';
    req.on('data', function (chunk) {
        alldata += chunk;
    })
    req.on('end', function () {
        var jsonAlldata = JSON.parse(alldata)
        var wherestr = {'aid': jsonAlldata.aid};
        console.log(jsonAlldata.aid)
        Comments.find(wherestr).sort({'create_time':1}).exec(function (err, ress) {
            if (err) {
                console.log("Error:" + err);
            }
            else {
                if (ress != '') {
                    console.log("找到评论了",ress)
                    /*var data=[{name:'wuhao',commentdate:'2017-10-10',tetx:'dswdwd',subComment:[{name:'',commentdata:'2016',text:'23232'}]}]*/
                    var comments=[]
                    /*ress.forEach(function (v,i,a) {*/
                    var total=1
                    for(let i=0;i<ress.length;i++){
                        if(ress[i].sub_re_cid!='0'){
                            console.log("ghjhgjhjkhjkh")
                            console.log(ress[i].sub_re_uid)
                            var findUser={'$or':[{'_id':ress[i].uid},{'_id':ress[i].sub_re_uid}]}
                           /* User.find(findUser, function (err, res_user) {
                                if (err) {
                                    console.log("Error:" + err);
                                }
                                else {
                                    if (res_user != '' ) {
                                        console.log("找到了2")
                                        console.log("res_user",res_user)

                                        var data={
                                            uid:res_user[0]._id,
                                            name:res_user[0].username,
                                            userPhoto:res_user[0].userPhoto,
                                            commentdate:ress[i].create_time,
                                            aid:ress[i].aid,
                                            content:ress[i].content,
                                            cid:ress[i]._id,
                                            re_cid:ress[i].re_cid,
                                            sub_re_cid:ress[i].sub_re_cid,
                                            sub_re_name:res_user[1].username
                                        }
                                        comments.push(data)
                                        if(total==ress.length){
                                            /!* console.log(comments)*!/
                                            var sortObj = comments.sort(compare("commentdate"));
                                            return res.json(toJSON(sortObj, '成功', '200', '0'))
                                        }
                                        total++
                                    } else {
                                        console.log('没找到')
                                        /!* return res.json(toJSON({}, '无此用户', '-1', '1'))*!/
                                    }
                                }
                            })*/
                        }else {
                            var findUser={'_id':ress[i].uid}

                        }
                        User.find(findUser, function (err, res_user) {
                            if (err) {
                                console.log("Error:" + err);
                            }
                            else {
                                if (res_user != '' ) {
                                    console.log("找到了")
                                    console.log("res_user",res_user)
                                    if(res_user[0]._id!=ress[i].uid&&res_user[1]){
                                        var temp=res_user[0];
                                        res_user[0]=res_user[1];
                                        res_user[1]=temp
                                    }
                                    var sub_re_name=''
                                    try {
                                        sub_re_name=res_user[1].username
                                    }catch(err) {}
                                    var data={
                                        uid:res_user[0]._id,
                                        name:res_user[0].username,
                                        userPhoto:res_user[0].userPhoto,
                                        commentdate:ress[i].create_time,
                                        aid:ress[i].aid,
                                        content:ress[i].content,
                                        cid:ress[i]._id,
                                        re_cid:ress[i].re_cid,
                                        sub_re_cid:ress[i].sub_re_cid,
                                        sub_re_name:sub_re_name
                                    }
                                    comments.push(data)
                                    if(total==ress.length){
                                        /* console.log(comments)*/
                                        var sortObj = comments.sort(compare("commentdate"));
                                        return res.json(toJSON(sortObj, '成功', '200', '0'))
                                    }
                                    total++
                                } else {
                                    console.log('没找到')
                                    /* return res.json(toJSON({}, '无此用户', '-1', '1'))*/
                                }
                            }
                        })

                    }

                } else {
                    console.log('没找到')
                    return res.json(toJSON({}, '文章不存在', '-1', '1'))
                }
            }
        })
    })
})
// 发送激活邮件
app.post('/activeEmail', function (req, res) {
    var alldata = '';
    req.on('data', function (chunk) {
        alldata += chunk;
    })
    req.on('end', function () {
        var jsonAlldata = JSON.parse(alldata)
        console.log("active", jsonAlldata)
        var url = "https://api.only1314.cn/sureActiveEmail?token=" + jsonAlldata.hash + "&username=" + jsonAlldata.username;
        var html='<div style="width: 100%;height: 300px;background: url(https://only1314.cn/static/images/email_bg.jpg) no-repeat center;background-size: cover;overflow: hidden;">'+
            '<h1 style="text-align: center;margin: 20px;">来自ONLY1314的激活邮件</h1>'+
            '<p style="text-align: center;color: #ffffff;margin-top: 75px;">感谢您注册并即将激活ONLY1314.cn的账号,本站将竭诚为您服务</p>'+
            '<div><a style="text-align: center;display: block;color: #ff4163;font-weight: 600;text-decoration: none;" href="'+url+'">戳我激活邮箱（快来愉快的玩耍~）</a></div>'+
        '</div>'
        var mailOptions = {
            from: 'ONLY1314 <admin@only1314.cn>', // 如果不加<xxx@xxx.com> 会报语法错误
            to: jsonAlldata.email, // list of receivers
            subject: '请点击链接激活您的邮箱~', // Subject line
            html: html// html body
        };
        console.log(mailOptions)
        send(mailOptions);
        return res.json(toJSON({}, '邮件发送成功', '200', '0'))
    })
})
// 确定激活
app.get('/sureActiveEmail', function (req, res) {
    var wherestr = {'username': req.query.username};
    User.find(wherestr, function (err, ress) {
        if (err) {
            console.log("Error:" + err);
        }
        else {
            console.log("返回", ress)
            if (ress != '' && ress[0].hash == req.query.token) {
                console.log("找到了")
                User.update({'username': req.query.username}, {'activeStatus': true}, function (err, resss) {
                    if (err) {
                        console.log("Error:" + err);
                    }
                    else {
                        console.log("Res:" + resss);
                        res.redirect('https://only1314.cn/activeSuccess.html');
                    }
                })

            } else {
                console.log('没找到')
                return res.json(toJSON({}, 'token错误', '-1', '1'))
            }
        }
    })
    /*console.log("/del_user 响应 DELETE 请求");
     res.send('删除页面');*/
})
// 是否成功激活
app.post('/isActiveSuccess', function (req, res) {
    var alldata = '';
    req.on('data', function (chunk) {
        alldata += chunk;
    })
    req.on('end', function () {
        var jsonAlldata = JSON.parse(alldata)
        console.log("active", jsonAlldata)
        var wherestr = {'username': jsonAlldata.username};
        User.find(wherestr, function (err, ress) {
            if (err) {
                console.log("Error:" + err);
            }
            else {
                console.log("返回", ress)
                if (ress != '' && ress[0].activeStatus == false) {
                    console.log("未激活")
                    res.json(toJSON({}, '未激活', '-1', '1'))

                } else {
                    console.log('激活')
                    return res.json(toJSON(ress[0], '已激活', '200', '0'))
                }
            }
        })

    })
})
// 注册
app.post('/regist', function (req, res) {
    var alldata = '';
    req.on('data', function (chunk) {
        alldata += chunk;
    })
    req.on('end', function () {
        /* console.log(alldata);
         console.log(typeof alldata)*/
        var jsonAlldata = JSON.parse(alldata)
        /* console.log(typeof  jsonAlldata)*/
        /* console.log(jsonAlldata)*/
        const hmac = crypto.createHmac('sha256', 'signup')
        hmac.update(jsonAlldata.email + Date.now())
        const hashcode = hmac.digest('hex')
        var data = {
            username: jsonAlldata.username,
            userpwd: jsonAlldata.password,
            userPhoto:'',
            email: jsonAlldata.email,
            hash: hashcode,
            activeStatus: false,
            logindate: new Date()
        }
        console.log(data)
        var wherestr = {'username': jsonAlldata.username};
        User.find(wherestr, function (err, ress) {
            if (err) {
                console.log("Error:" + err);
            }
            else {
                console.log("返回", ress)
                if (ress != '') {
                    console.log("找到了")
                    return res.json(toJSON({}, '用户名已存在', '-1', '1'))

                } else {
                    var user = new User(data)
                    user.save(function (err, ress) {
                        if (err) {
                            console.log("Error")
                        } else {
                            var oldPath='../usr/share/nginx/html/static/images/photo.png';
                            var date = Date.parse(new Date())
                            fs.mkdirSync('../usr/share/nginx/html/images/User/'+ress._id+'/')
                            var newPath='../usr/share/nginx/html/images/User/'+ress._id+'/'+ress._id+'_'+date+'.png'
                            copyFile(oldPath,newPath)
                            User.update({'_id': ress._id}, {'userPhoto':'https://only1314.cn/images/User/'+ress._id+'/'+ress._id+'_'+date+'.png'}, function (err, resss) {
                                if (err) {
                                    console.log("Error:" + err);
                                }
                                else {
                                    ress.userPhoto='https://only1314.cn/images/User/'+ress._id+'/'+ress._id+'_'+date+'.png';
                                    return res.json(toJSON(ress, '成功', '200', '0'))
                                }
                            })
                        }
                    })


                }
            }
        })

        /*res.write(alldata)
         res.end();*/
    })
})
// 登陆
app.post('/login', function (req, res) {
    var sess = req.session;
    var alldata = '';
    req.on('data', function (chunk) {
        alldata += chunk;
    })
    req.on('end', function () {
        var jsonAlldata = JSON.parse(alldata)
        var wherestr = {'username': jsonAlldata.username};
        User.find(wherestr, function (err, ress) {
            if (err) {
                console.log("Error:" + err);
            }
            else {
                if (ress != '' && ress[0].userpwd == jsonAlldata.password) {
                    console.log("找到了")
                        return res.json(toJSON(ress[0], '成功', '200', '0'))
                } else {
                    console.log('没找到')
                    return res.json(toJSON({}, '用户名或密码错误', '-1', '1'))
                }
            }
        })
    })
})
// 对文章的回复接口
app.post('/z_reply', function (req, res) {
    var alldata = '';
    req.on('data', function (chunk) {
        alldata += chunk;
    })
    req.on('end', function () {
        var jsonAlldata = JSON.parse(alldata)
        console.log(jsonAlldata)
        var newReply = {
            uid: jsonAlldata.uid,
            aid: jsonAlldata.aid,
            content: jsonAlldata.content,
            create_time: new Date(),
            re_cid: jsonAlldata.re_cid,
            sub_re_cid:jsonAlldata.sub_re_cid,
            sub_re_uid:jsonAlldata.sub_re_uid
        }
        console.log(typeof newReply.uid)
        var comment = new Comments(newReply)
        comment.save(function (err, ress) {
            if (err) {
                console.log("Error")
            } else {
                console.log("comment保存成功",ress)
                var ress=ress;
                var wherestr = {'_id': ress.uid};
                User.find(wherestr, function (err, resss) {
                    if (err) {
                        console.log("Error:" + err);
                    }
                    else {
                        if (resss != '') {
                          /*  console.log("找到用户",resss)
                            ress.userPhoto=resss[0].userPhoto;
                            ress.username=resss[0].username;*/
                            var data={
                                aid:jsonAlldata.aid,
                                cid:ress._id,
                                commentdate:ress.create_time,
                                content:ress.content,
                                name:resss[0].username,
                                re_cid:'0',
                                sub_re_cid:'0',
                                sub_re_name:'',
                                uid:resss[0]._id,
                                userPhoto:resss[0].userPhoto,
                                subComments:[]
                            }
                            console.log("组合之后",data)
                            return res.json(toJSON(data, '成功', '200', '0'))

                        } else {
                           console.log("无此用户")

                        }
                    }
                })

            }
        })

        /*var data=[{name:'wuhao',commentdate:'2017-10-10',tetx:'dswdwd',subComment:[{name:'',commentdata:'2016',text:'23232'}]}]*/
    })
})
// 对某一条回复的接口
app.post('/s_reply', function (req, res) {
    var alldata = '';
    req.on('data', function (chunk) {
        alldata += chunk;
    })
    req.on('end', function () {
        var jsonAlldata = JSON.parse(alldata)
        var newReply = {
            uid: jsonAlldata.uid,
            aid: jsonAlldata.aid,
            content: jsonAlldata.content,
            create_time: new Date(),
            re_cid: jsonAlldata.re_cid,
            sub_re_cid:jsonAlldata.sub_re_cid,
            sub_re_uid:jsonAlldata.sub_re_uid
        }
        var comment = new Comments(newReply)
        comment.save(function (err, ress) {
            if (err) {
                console.log("Error")
            } else {
                console.log("comment保存成功",ress)
                var ress=ress;
                console.log("ssssss",ress)
                if(jsonAlldata.sub_re_cid!='0'){
                    var wherestr={'$or':[{'_id':ress.uid},{'_id':ress.sub_re_uid}]}
                }else {
                    var wherestr={'_id':ress.uid}
                }
                User.find(wherestr, function (err, resss) {
                    if (err) {
                        console.log("Error:" + err);
                    }
                    else {
                        if (resss != '') {
                            if(resss[0]._id!=ress.uid){
                                var temp=resss[0];
                                resss[0]=resss[1];
                                resss[1]=temp
                            }
                            var sub_re_name=''
                            try {
                                sub_re_name=resss[1].username
                            }catch(err) {}
                            var data={
                                aid:jsonAlldata.aid,
                                cid:ress._id,
                                commentdate:ress.create_time,
                                content:ress.content,
                                name:resss[0].username,
                                re_cid:jsonAlldata.re_cid,
                                sub_re_cid:jsonAlldata.sub_re_cid,
                                sub_re_name:sub_re_name,
                                uid:resss[0]._id,
                                userPhoto:resss[0].userPhoto,
                                subComments:[]
                            }
                            console.log("组合之后",data)
                            return res.json(toJSON(data, '成功', '200', '0'))

                        } else {
                            console.log("无此用户")

                        }
                    }
                })

            }
        })
        /*var data=[{name:'wuhao',commentdate:'2017-10-10',tetx:'dswdwd',subComment:[{name:'',commentdata:'2016',text:'23232'}]}]*/
    })
})

//  /list_user 页面 GET 请求
app.get('/list_user', function (req, res) {
    console.log("/list_user GET 请求");
    res.send('用户列表页面');
})

// 对页面 abcd, abxcd, ab123cd, 等响应 GET 请求
app.get('/ab*cd', function (req, res) {
    console.log("/ab*cd GET 请求");
    res.send('正则匹配');
})

var server = app.listen(8081, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("应用实例，访问地址为 http://%s:%s", host, port)

})