const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

const port = 3000
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI,  {useNewUrlParser: true}).catch( (e) => {
  console.log(e);
});
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var Schema = mongoose.Schema;
var schema = new Schema({
  mood: String
});
var Mood = mongoose.model('Mood', schema);

app.get('/', (req, res) => res.send("hello world"))

app.post('/api/mood', (req, res) => {
  var mood = {
    "mood": `${req.body.mood}`,
  };
  console.log(mood);
  var newMood = new Mood(mood);
  newMood.save((err, data) => {
    res.json(data);
  });
});

app.get('/api/mood', (req, res) => {
  Mood.find({}, (err, data) => {
    res.json(data)
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
