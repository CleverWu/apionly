//email.js
var mailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var transport = mailer.createTransport(smtpTransport({
    host: 'smtp.only1314.cn',
    port: 465,
    auth: {
        user: 'admin@only1314.cn',
        pass: '15386616570W.h'
    }
}));


module.exports=function (mailOptions) {
    transport.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Message sent: ' + info.response);
        }
    });
}