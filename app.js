//jshint esversion:6
require('dotenv').config();
//console.log(process.env);

const md5 = require('md5');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect(process.env.DB_URL, {useNewUrlParser: true});

const userSchema = new mongoose.Schema( {
  email: String,
  password: String
});

const secret = process.env.DB_KEY;

const User = mongoose.model("User", userSchema);

app.get("/", function(request, response){
  response.render("home");
});

app.get("/login", function(request, response){
  response.render("login");
});

app.get("/register", function(request, response){
  response.render("register");
});

app.post("/register", function(request, response){

  bcrypt.hash(request.body.password, saltRounds, function(err, hash) {

    const newUser = new User ({
      email: request.body.username,
      password: hash
    });
    newUser.save(function(error){
      if (error){
        console.log ("Error al crear usuario");
      } else {
        response.render("secrets");
      }
    });
  });

});

app.post("/login", function(request, response){

    const username = request.body.username;
    const password =  request.body.password;

    User.findOne({email: username}, function (error, foundUser){
      if (error){
        console.log("error- >" + error);
      } else {
        if (foundUser){

          bcrypt.compare(request.body.password, foundUser.password, function(err, result) {
            if( result == true){
              response.render("secrets")
            } else {
              response.render("register");
            }
          });
        } else {
          response.render("home");
        }
      }
    });
});


app.listen(8086, function(){
  console.log("Running in port 8086");
})
