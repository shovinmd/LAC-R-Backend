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
  // Configurable status fields for GEM model homescreen
  gem_status_config: {
    battery_level: {
      type: String,
      default: '82%'
    },
    signal_strength: {
      type: String,
      default: 'Good'
    },
    alert_message: {
      type: String,
      default: 'Obstacle Detected'
    }
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
// Replace/augment with compound index for lookup by owner + ip + model (NOT unique)
robotSchema.index({ owner_uid: 1, local_ip: 1, model: 1 });

module.exports = mongoose.model('Robot', robotSchema);
