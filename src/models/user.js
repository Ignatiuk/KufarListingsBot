const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: 'number',
  name: 'string',
  registrationDate: 'number',
  requests: 'array',
  session: 'string',
});

const User = mongoose.model('User', userSchema);

module.exports = User;