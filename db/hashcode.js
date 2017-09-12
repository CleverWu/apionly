var mongoose = require('./db.js'),
    Schema=mongoose.Schema;
var HashSchema=new  Schema({
    createAt: {
        type: Date,
        default: Date.now(),
        index: { expires: 60*1 } //设置验证码的有效时间为 10 分钟
    },
    hash:{type:String}

})
module.exports=mongoose.model('Hash',HashSchema);