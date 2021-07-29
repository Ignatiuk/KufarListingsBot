const mongoose = require('mongoose');
const config = require('../../config');

mongoose.connect(config.DB_TOKEN, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
});