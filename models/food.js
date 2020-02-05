var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/yel_camp", {useNewUrlParser: true});
var conn = mongoose.Collection;

var FoodSchema = new mongoose.Schema({
    name : String ,
    image : String ,
    recipe : String,
    author : {
            id : {
                type : mongoose.Schema.Types.ObjectId,
                ref : "User"
            },
            username : String
    },
    comments : [
        {
            type : mongoose.Schema.Types.ObjectId ,
            ref : "Comment"
        }
    ]
});

module.exports = mongoose.model("Food" , FoodSchema);