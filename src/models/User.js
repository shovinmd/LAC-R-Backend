const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebase_uid: {
    type: String,
    required: true,
    unique: true,
    index: true
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
  created_at: {
    type: Date,
    default: Date.now
  },
  has_robot: {
    type: Boolean,
    default: false
  },
  security: {
    dashboard_lock: {
      type: Boolean,
      default: true
    }
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
userSchema.index({ firebase_uid: 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
