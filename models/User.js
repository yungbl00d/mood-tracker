const mongoose = require('mongoose');
const { Schema } = mongoose;
const userSchema = new Schema({
  username: String,
  password: String,
  moods: [String],
  streak: Number
});
userSchema.methods.validPassword = function(password){
  return this.password === password
}
var User = mongoose.model('User', userSchema);
exports.user = User;
