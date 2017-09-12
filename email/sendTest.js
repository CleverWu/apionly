//sendtest.js
var send = require('./email');
var mailOptions = {
    from: 'ONLY1314 <admin@only1314.cn>', // 如果不加<xxx@xxx.com> 会报语法错误
    to: '348296106@qq.com', // list of receivers
    subject: '这是一封测试邮件', // Subject line
    html: 'ded1'// html body
};
send(mailOptions);