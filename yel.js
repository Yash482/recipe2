var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose  = require("mongoose");
var flash = require("connect-flash");
var path = require("path");
var crypto = require("crypto");
var multer = require("multer");
var GridFsStorage = require("multer-gridfs-storage");
var Grid = require("gridfs-stream");
var Food = require("./models/food.js");
var User = require("./models/user.js");
var Comment = require("./models/comment.js");
var methodOverride = require("method-override");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var SeedDB = require("./seed.js");

//mongoose.connect("mongodb+srv://yash:mnopqrst@cluster0-ubxmo.mongodb.net/test?retryWrites=true&w=majority", {useNewUrlParser: true, useCreateIndex: true });
mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost/yel_camp',{
   useNewUrlParser: true;
   useUnifiedTopology: true; 
});
app.use(bodyParser.urlencoded({extended : true}));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(express.static(__dirname + '/public'));



// Image============
var Storage = multer.diskStorage({
    destination: "./public/uploads/",
    filename : (req, file, cb)=>{
        cb(null, file.fieldname+"_"+Date.now()+path.extname(file.originalname));
    }
});

var upload = multer({
    storage : Storage
}).single("file");


//// PASSPORT CONFIG===========

app.use(require("express-session")({
    secret : "I am the best",
    resave : false,
    saveUninitialized : false
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});
// SeedDB();

app.get("/", function(req, res){
    res.render("yelhome");
});

app.get("/data", function(req, res){
    Food.find({}, function(err, foods){
         if(err){
             console.log(err);
         } else{
            res.render("yeldata", {foods: foods});
         }
    });
   
});

//==================================
//  ROUTES
//==================================

// Form to add new dish
app.get("/data/new", isLoggedIn,  function(req, res){
    res.render("yelnew");
});

// Handle addition of new dish
app.post("/data",isLoggedIn,upload, function(req, res){
    // if(!req.body.recipe || !req.body.name ){
    //     req.flash("error", "Invalid details");
    //     res.redirect("/data/new");
    // }
    var  author = {
        id : req.user._id,
        username : req.user.username
    }
    //var img = req.file.filename;
    var newDish = {name: req.body.name, image : req.file.filename ,  recipe: req.body.recipe, author : author};
    Food.create(newDish, function(err, newone){
        if(err || !req.body.recipe){
            console.log("error iss this=========" +err);
            req.flash("error", "Invalid details");
            res.redirect("/data/new");
        } else{
            res.redirect ("/data");
        }
    });
    
});


// Show specific food
app.get("/data/:id", function(req, res){
     Food.findById(req.params.id).populate("comments").exec(function(err, foundfood){
           if(err){
               console.log(err);
           } else{
               res.render("yelshow",{food: foundfood} );
           }
     });
});

// get the searched food
app.post("/data/search", function(req, res){
     var matchedFoods = [];
     Food.find({}, function(err, foods){
         foods.forEach(function(food){
               if(food.name.includes(req.body.searchedfood)){
                   matchedFoods.push(food);
                  // console.log(matchedFoods);
                } 
         });
         res.render("yeldata", {foods: matchedFoods});
     });
});


//========Edit and Update data================

app.get("/data/:id/edit",isLoggedIn, checkfoodOwnership,  function(req,res){
     Food.findById(req.params.id, function(err, food){
        if(err){
            console.log(err);
        } else{
              res.render("yeledit", {food: food});
            } 
     });
});

app.put("/data/:id",isLoggedIn, checkfoodOwnership, function(req, res){
       Food.findByIdAndUpdate(req.params.id, req.body.food, function(err, updatedone){
        if(err){
            console.log(err);
        } else{
           res.redirect("/data/" + req.params.id);
        }
       });
});



//==========DELETE DATA======================

app.delete("/data/:id", isLoggedIn, checkfoodOwnership, function(req, res){
     Food.findByIdAndRemove(req.params.id, function(err, deletedone){
        if(err){
            console.log(err);
        } else{
           res.redirect("/data");
        }
     });
});

function checkfoodOwnership(req, res, next){
    if(req.isAuthenticated){
        Food.findById(req.params.id, function(err, food){
           if(err){
               req.flash("error", "YOUR FOOD IS NOT FOUND");
               res.redirect("/data");
           } else{
               
               if(req.user.username == "Yash Bansal" ||  food.author.id.equals(req.user._id) ){
                 next();
               } else {
                req.flash("error", "YOU ARE NOT AUTHOURISED TO DO THAT");
                res.redirect("/data");
               }
           }
        });
       } else {
           req.flash("error", "YOU NEED TO LOG IN FIRST");
           res.redirect("/login");
       }
}

//=======Particular User Recipies============

app.post("/user/:id/recipies", isLoggedIn, function(req, res){
    var userfood = [];
    Food.find({}, function(err, foods){
          if(err){
              req.flash("error", "Something Happened. Try Again");
              res.redirect("/data");
          }  else{
              foods.forEach(function(food){
                   if(food.author.id.equals(req.params.id)){
                        userfood.push(food);
                   };
              });
            res.render("yeldata" , {foods : userfood});
          }
    });
});

//===========================================

//======COMMENTS ROUTES========================


app.get("/data/:id/comments/new", isLoggedIn, function(req, res){
    Food.findById(req.params.id, function(err, food){
         if(err){
             console.log(err);
         } else{
            res.render("newcomment", {food: food});
         }
    });
});

app.post("/data/:id/comments",isLoggedIn, function(req, res){
    //create the comment 
     Comment.create(req.body.comment, function(err, comment){
         if(err){
             console.log(err);
         } else{
             // assotiate to food
             Food.findById(req.params.id, function(err, food){
                 // associating comment with user
                 comment.author.id = req.user._id ;
                 comment.author.username = req.user.username ;
                 comment.save();
                 food.comments.push(comment);
                 food.save();
             });
             res.redirect("/data/" + req.params.id);
         }
     })
});

//==========DELETE COMMENT======================

app.delete("/data/:foodid/comment/:id", isLoggedIn, function(req, res){
    Comment.findByIdAndRemove(req.params.id, function(err, deletedone){
       if(err){
           console.log(err);
       } else{
           req.flash("success" , "Comment Deleted");
          res.redirect("/data/" + req.params.foodid);
       }
    });
});

////=====AUTH ROUTES==============

//  REGISTER===============

app.get("/register", function(req, res){
     res.render("register");
});

app.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            req.flash("error", err.message);
            res.redirect("/register");
           // return res.render("yelshow");
        } 
        passport.authenticate("local")(req, res, function(){
            res.redirect("/data");
        });
    });
});

//======login===================

app.get("/login", function(req, res){
    res.render("login");
});

app.post("/login", passport.authenticate("local",
  {

    successRedirect: "/data",
    failureRedirect: "/login"
  }),function(req ,res){
      console.log("you won");
});

//=======logout======

app.get("/logout", function(req, res){
     req.logout();
     req.flash("success" , "LOGGED YOU OUT");
     res.redirect("/data");
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
       return next();
    }
    req.flash("error" , "YOU NEED TO LOG IN FIRST");
    res.redirect("/login");
}


app.listen(process.env.PORT, process.env.IP, function(){
   console.log("yelcamp has started");
});