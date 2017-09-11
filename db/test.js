var User = require("./user.js");
/**
* 插入
*/
function insert() {
    var user=new User({
        username:'wuhao',
        userpwd:'111111',
        userage:24,
        logindate:new Date()
    })
    user.save(function (err,res) {
        if(err){
            console.log("Error")
        }else{
            console.log("yew")
        }
    })
}
insert();