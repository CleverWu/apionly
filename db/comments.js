var mongoose = require('./db.js'),
    Schema=mongoose.Schema;
var CommentsSchema=new Schema(
    {
        uid:{type:Number},
        aid: {type: Number},
        content:{type:String},
        re_cid:{type:Number},
        sub_re_cid:{type:Number},
        create_time:{type:Date}
    }
)
module.exports=mongoose.model('Comments',CommentsSchema);