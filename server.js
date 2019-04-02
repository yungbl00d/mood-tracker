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
    //check Date
    currDate = new Date(Date.now());
    currDay = currDate.getUTCDay();
    if(currDay == (data.lastSubmittedDay + 1) ||
     (currDay == 0 && data.lastSubmittedDay == 6)){//consecutive day post
       data.currentStreak++;
       data.bestStreak = Math.max(data.currentStreak, data.bestStreak);
     }
    else if (currDay != data.lastSubmittedDay){//user missed a day
      data.currentStreak = 0;
    }
    //if neither if is triggered, user is posting on the same day
    data.lastSubmittedDay = currDay;
    data.moods.push(req.body.mood);
    data.save((err) => {
      res.json(data);
    });

  });
});

app.get('/mood', ensureAuthenticated,  (req, res) => {
  console.log(req.user)

  User.findOne({username: req.user.username}, (err, data) => {
    res.json({"moods": data.moods});
  });

});

app.get('/percentile', ensureAuthenticated, (req, res) => {
  User.find({}, (err, data) => {
    var total = data.length;
    var percentIncrement = 100 / total;
    var rank = 0;
    for(var i = 0; i < total; i++){rank += req.user.bestStreak > data[i].bestStreak ? 1 : 0;}
    //loop counts how many users the current one is ahead of
    res.json({"percentile-rank": Math.floor(rank * percentIncrement)});
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
      var curr = new Date(Date.now())
      newUser = new User({
        username: req.body.username,
        password: req.body.password,
        currentStreak: 0,
        bestStreak: req.body.bestStreak,
        lastSubmittedDay: curr.getUTCDay()
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
