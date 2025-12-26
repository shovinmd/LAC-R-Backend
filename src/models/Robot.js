const mongoose = require('mongoose');

const robotSchema = new mongoose.Schema({
  robot_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  owner_uid: {
    type: String,
    required: true,
    index: true
  },
  model: {
    type: String,
    required: true,
    enum: ['LAC-R', 'GEM']
  },
  local_ip: {
    type: String,
    required: true
  },
  ip_password_hash: {
    type: String,
    required: false,
    default: null
  },
  network_mode: {
    type: String,
    enum: ['AP', 'STA', 'APSTA'],
    default: 'AP'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
robotSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Index for efficient queries
robotSchema.index({ owner_uid: 1, model: 1 });
robotSchema.index({ local_ip: 1, model: 1 }); // Allow same IP for different models

module.exports = mongoose.model('Robot', robotSchema);
