var mongoose = require('./db.js'),
    Schema=mongoose.Schema;
var CommentsSchema=new Schema(
    {
        uid:{type:String},
        aid: {type: String},
        content:{type:String},
        re_cid:{type:String},
        sub_re_cid:{type:String},
        sub_re_uid:{type:String},
        create_time:{type:Date}
    }
)
module.exports=mongoose.model('Comments',CommentsSchema);