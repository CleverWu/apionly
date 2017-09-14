var mongoose = require('./db.js'),
    Schema=mongoose.Schema;
var ArticleSchema=new Schema(
    {
        userId:{type:String},
        author: {type: String},
        date1: {type: Date},
        date2: {type: Date},
        companyName: {type: String},
        address: {type: String},
        region: {type: String},
        desc: {type: String},
        picArr:{type:Array},
        publishdate: {type: Date},
        // 新增
        replyNums:{type:Number},
        likeNums:{type:Number},
        remark:{type:String},
        comments:{type:Array}

    }
)
module.exports=mongoose.model('Article',ArticleSchema);