var mongoose = require('./db.js'),
    Schema=mongoose.Schema;
var UserSchema=new  Schema({
    username:{type:String},
    userpwd:{type:String},
    email:{type:String},
    hash:{type:String},
    activeStatus:{type:Boolean},
    logindate:{type:Date}
})
module.exports=mongoose.model('User',UserSchema);