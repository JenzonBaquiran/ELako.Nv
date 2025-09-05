const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    middlename: { type: String },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true }
  },
  { collection: 'user-data' }
);

module.exports = mongoose.model('User', UserSchema);
