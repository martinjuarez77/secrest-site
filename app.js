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
const findOrCreate = require('mongoose-findorcreate');
const GoogleStrategy = require('passport-google-oauth20').Strategy;


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
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const secret = process.env.DB_KEY;

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(error, user){
    done(error, user);
  })
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:8086/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(request, response){
  response.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", function(request, response){
  response.render("login");
});

app.get("/register", function(request, response){
  response.render("register");
});

app.get("/secrets", function(request, response){

  User.find({"secret": {$ne:null}}, function(error, foundUsers){
    if (error){
      console.log(error);
      response.redirect("/register")
    } else {
      if (foundUsers){
        response.render("secrets", {userWithSecrets: foundUsers})
      }
    }
  });
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

app.get("/submit", function(request, response){
  if (request.isAuthenticated()){
    response.render("submit");
  } else {
    response.redirect("/login");
  }
})

app.post("/submit", function(request, response){
  if (request.isAuthenticated()){
    const submittedSecret = request.body.secret;

    console.log(submittedSecret);
    console.log(request.user);

    User.findById(request.user.id, function(error, foundUser){
      if (error){
        console.lor(error);
        response.redirect("/login");
      } else {
        if (foundUser){
          foundUser.secret = submittedSecret;
          foundUser.save(function(){
            response.redirect("/secrets")
          })
        }
      }
    });
  } else {
    response.redirect("/login");
  }
})

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
