const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebase_uid: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  photo_url: {
    type: String,
    default: null,
    trim: true
  },
  model_selected: {
    type: Boolean,
    default: false
  },
  model: {
    type: String,
    enum: ['LAC-R', 'GEM', null],
    default: null
  },
  models: {
    type: [String],
    default: [],
  },
  active_model: {
    type: String,
    enum: ['LAC-R', 'GEM', null],
    default: null
  },
  dashboard_lock_enabled: {
    type: Boolean,
    default: true
  },
  dashboard_pin_hash: {
    type: String,
    default: null
  },
  has_robot: {
    type: Boolean,
    default: false
  },
  robot_id: {
    type: String,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  last_login: {
    type: Date,
    default: null
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
