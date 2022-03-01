//jshint esversion:6
require('dotenv').config();
//console.log(process.env);

const md5 = require('md5');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

// inicializamos passport
app.use(session({
  secret: process.env.PASSPORT_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.DB_URL, {useNewUrlParser: true});

const userSchema = new mongoose.Schema( {
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

const secret = process.env.DB_KEY;

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(request, response){
  response.render("home");
});

app.get("/login", function(request, response){
  response.render("login");
});

app.get("/register", function(request, response){
  response.render("register");
});

app.get("/secrets", function(request, response){
  if (request.isAuthenticated()){
    response.render("secrets");
  } else {
    response.redirect("/login");
  }
})

app.post("/register", function(request, response){

  User.register({username: request.body.username}, request.body.password, function(error, user){
    if (error){
      console.log(error);
      response.redirect("/register")
    } else {
      passport.authenticate("local")(request, response, function(){
        response.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function(request, response){

  const user = new User({
    username: request.body.username,
    password: request.body.password
  });

  request.login(user, function(error){
    if (error){
      console.log(error);
    } else {
      passport.authenticate("local")(request, response, function(){
        response.redirect("/secrets");
      });
    }
  });
});

app.get("/logout", function(request, response){
    request.logout();
    response.redirect("/");
})
app.listen(8086, function(){
  console.log("Running in port 8086");
})
