var express = require('express');
var fs = require('fs');
var app = express();
/*var multipart = require('connect-multiparty');
 var multipartMiddleware = multipart();*/
var querystring = require('querystring');
var crypto = require('crypto');
var User = require('./db/user.js')
var Article = require('./db/article.js')
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
                remark: jsonAlldata.remark || '',
                comments: []
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
                 var path = '../usr/share/nginx/html/upload/images/' + filename + '/';
                 var imgSrc = '../usr/share/nginx/html/upload/images/' + filename + '/' + Date.parse(date) + i + '.png'
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
            var base64 = userPhoto.replace(/^data:image\/\w+;base64,/, "");
            var dataBuffer = new Buffer(base64, 'base64'); //把base64码转成buffer对象
            var date = new Date();
            var filename = String(date.getFullYear()) + String(date.getMonth() + 1) + String(date.getDate());
             var path = '../usr/share/nginx/html/upload/images/photo/' + filename + '/';
             var imgSrc = '../usr/share/nginx/html/upload/images/photo/' + filename + '/' + Date.parse(date) + '.png'
           /* var path = './img/photo/' + filename + '/';
            var imgSrc = './img/photo/' + filename + '/' + Date.parse(date)+ '.png'*/

            var imgname = Date.parse(date) + '.png';
            try {
                fs.writeFileSync(imgSrc, dataBuffer)
            } catch (err) {
                fs.mkdirSync(path)
                fs.writeFileSync(imgSrc, dataBuffer)
            }
            var wherestr = {'username': jsonAlldata.username};
            User.find(wherestr, function (err, ress) {
                if (err) {
                    console.log("Error:" + err);
                }
                else {
                    console.log("返回", ress)
                    if (ress != '') {
                        console.log("找到了")
                        User.update({'username': jsonAlldata.username}, {'userPhoto': 'https://only1314.cn/upload/images/photo/'+filename + '/' + imgname}, function (err, resss) {
                            if (err) {
                                console.log("Error:" + err);
                            }
                            else {
                                console.log("Res:" + resss);
                                ress[0].userPhoto='https://only1314.cn/upload/images/photo/'+filename + '/' + imgname;
                                return res.json(toJSON(ress[0], '头像更新成功', '200', '0'))
                            }
                        })

                    } else {
                        console.log('没找到')
                        return res.json(toJSON({}, 'token错误', '-1', '1'))
                    }
                }
            })

        }

    })
})
function writeToFile(i, imgSrc, imgname, filename, dataBuffer, jsonAlldata, res) {
    fs.writeFileSync(imgSrc, dataBuffer)
    jsonAlldata.picArr[i] = 'https://only1314.cn/upload/images/' + filename + '/' + imgname;
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
            remark: jsonAlldata.remark || '',
            comments: []

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
                console.log("返回", ress)
                if (ress != '') {
                    console.log("找到了")
                    return res.json(toJSON(ress, '成功', '200', '0'))
                } else {
                    console.log('没找到')
                    return res.json(toJSON({}, '用户名或密码错误', '-1', '1'))
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
        var mailOptions = {
            from: 'ONLY1314 <admin@only1314.cn>', // 如果不加<xxx@xxx.com> 会报语法错误
            to: jsonAlldata.email, // list of receivers
            subject: '请点击链接激活您的邮箱~', // Subject line
            html: '<a href=' + url + '>点我激活您的邮箱' + url + '</a>'// html body
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
                        res.redirect('https://only1314.cn');
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
            userPhoto:'https://only1314.cn/static/images/photo.png',
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
                    console.log('没找到')
                    return res.json(toJSON({}, '用户名已存在', '-1', '1'))

                } else {
                    var user = new User(data)
                    user.save(function (err, ress) {
                        if (err) {
                            console.log("Error")
                        } else {
                            console.log("ress", ress)
                            return res.json(toJSON(ress, '成功', '200', '0'))
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
            name: jsonAlldata.userName,
            userPhoto: jsonAlldata.userPhoto,
            text: jsonAlldata.text,
            commentdate: new Date(),
            subComment: []
        }
        var wherestr = {'_id': jsonAlldata.articleId};
        Article.find(wherestr, function (err, ress) {
            if (err) {
                console.log("Error:" + err);
            }
            else {
                console.log("返回", ress)
                if (ress != '') {
                    console.log("找到了")
                    Article.update({'_id': jsonAlldata.articleId}, {$push: {comments: newReply}}, function (err, resss) {
                        if (err) {
                            console.log("Error:" + err);
                        }
                        else {
                            console.log("Res:" + resss);
                            console.log("更新成功")
                            Article.find(wherestr, function (err, finnal) {
                                if (err) {
                                    console.log("错误")
                                } else {
                                    var data = {
                                        all: finnal,
                                        thisArticle: newReply
                                    }
                                    return res.json(toJSON(data, '回复成功', '200', '0'))
                                }
                            })

                        }
                    })

                } else {
                    console.log('没找到')
                    return res.json(toJSON({}, 'token错误', '-1', '1'))
                }
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
        console.log(jsonAlldata)
        var index = jsonAlldata.index;
        var newReply = {
            name: jsonAlldata.userName,
            userPhoto: jsonAlldata.userPhoto,
            text: jsonAlldata.text,
            commentdate: new Date()
        }
        var wherestr = {'_id': jsonAlldata.articleId};
        Article.find(wherestr, function (err, ress) {
            if (err) {
                console.log("Error:" + err);
            }
            else {
                console.log("返回", ress)
                if (ress != '') {
                    ress[0].comments[index].subComment.push(newReply)
                    /*console.log("新",ress[0].comments[index])
                     console.log("找到了")*/
                    Article.update({'_id': jsonAlldata.articleId}, {comments: ress[0].comments}, function (err, resss) {
                        if (err) {
                            console.log("Error:" + err);
                        }
                        else {
                            console.log("Res:" + resss);
                            console.log("更新成功")
                            Article.find(wherestr, function (err, finnal) {
                                if (err) {
                                    console.log("错误")
                                } else {
                                    var data = {
                                        all: finnal,
                                        thisArticle: newReply
                                    }
                                    return res.json(toJSON(data, '回复成功', '200', '0'))
                                }
                            })

                        }
                    })

                } else {
                    console.log('没找到')
                    return res.json(toJSON({}, 'token错误', '-1', '1'))
                }
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