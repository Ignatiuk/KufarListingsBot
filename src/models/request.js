const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  userId: 'number',
  query: 'string',
  lastListing: {},
});

const Request = mongoose.model('Request', requestSchema);

module.exports = Request;