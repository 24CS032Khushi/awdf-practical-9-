const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Stores the bcrypt HASH only. select:false => never returned unless asked for.
    password: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
