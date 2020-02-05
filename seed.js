var mongoose  = require("mongoose");
var Food = require("./models/food.js");
var Comment = require("./models/comment.js");


// var data = [
//     {
//         name : "Burger" ,
//         image : "https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=200&q=50",
//         recipe : "Not that hard to make. Make the stuffing and grill it properly"
//     },
//     {
//         name : "Pizza" ,
//         image : "https://images.unsplash.com/photo-1506354666786-959d6d497f1a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=200&q=50",
//         recipe : "Not that hard to make. Make the stuffing and grill it properly"
//     }
// ]

function SeedDB(){
    // Remove all data
  Food.remove({},function(err){
     if(err){
         console.log(err);
     }
       console.log("data removed");

  });

  data.forEach(function(dish){
      // create dish using data array
     Food.create(dish, function(err, food){
          if(err){
              console.log(err);
          } else{
              console.log("one dish added");
          }
           // Adding Comment
           Comment.create({
               author: "Yash Bansal",
               content: "This is great. You er doing wonderful job"
           }, function(err, comment){
               if(err){
                   console.log(err);
               } else{
                   food.comments.push(comment);
                   food.save();
                   console.log("Comment Added");
               }
           })
     });
  });
}

module.exports = SeedDB ;