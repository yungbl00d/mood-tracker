const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;
var session = require('express-session')
var User = require('./models/User.js').user;

const port = 3000
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI,  {useNewUrlParser: true}).catch( (e) => {
  console.log(e);
});

//config

app.use(session({
  secret: "cats",
  resave: true,
  saveUninitialized: true
 }));
app.use(passport.initialize());
app.use(passport.session())
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());



var done = (err, data) => {
  if(err) console.log(err);
  console.log(data);
};

//passport config
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      console.log(user)
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));
function ensureAuthenticated(req, res, next) {

  if (req.isAuthenticated()) {
      console.log("authenticated");
      return next();

  }
  res.redirect('/');
};

//routes
app.get('/', (req, res) => res.sendFile(__dirname + "/views/index.html"))

app.post('/mood', ensureAuthenticated, (req, res) => {
  User.findOne({username: req.user.username}, (err, data) => {
    console.log(data);
    data.moods.push(req.body.mood);
    data.save((err) => {
      res.json(data);
    })

  });
});

app.get('/mood', ensureAuthenticated,  (req, res) => {
  console.log(req.user)
  User.find({username: req.user.username}, (err, data) => {
    res.json({"moods": data[0].moods});
  });
});


app.get('/register', (req, res) => {
  res.sendFile(__dirname + "/views/register.html");
});

app.post('/register', (req, res) => {
  User.findOne({username: req.body.username}, (err, data) => {
    if(err) {
      next(err)
    }
    else if (data) {
      res.redirect('/');
      console.log("user already created");
    }
    else{
      newUser = new User({
        username: req.body.username,
        password: req.body.password,
        streak: 0
      });
      newUser.save((err) => {
        res.send(newUser);
        console.log(newUser);
      });
    }
  });

});

app.post('/login',
  passport.authenticate('local', {session: true}),
  function(req, res) {

    res.sendFile(__dirname + "/views/profile.html")
  });



app.listen(port, () => console.log(`Mood app listening on port ${port}!`))
