var mongoose = require('./db.js'),
    Schema=mongoose.Schema;
var ArticleSchema=new Schema(
    {
        userId:{type:String},
        author: {type: String},
        date1: {type: Date},
        date2: {type: Date},
        companyName: {type: String},
        region: {type: String},
        desc: {type: String},
        picArr:{type:Array},
        publishdate: {type: Date}
    }
)
module.exports=mongoose.model('Article',ArticleSchema);