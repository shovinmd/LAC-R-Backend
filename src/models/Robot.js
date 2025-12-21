const mongoose = require('mongoose');

const robotSchema = new mongoose.Schema({
  robotId: {
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
  model: {
    type: String,
    required: true,
    enum: ['LAC-R Basic', 'LAC-R Pro', 'LAC-R Advanced']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'maintenance', 'error'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  location: {
    latitude: Number,
    longitude: Number,
    accuracy: Number
  },
  firmwareVersion: {
    type: String,
    default: '1.0.0'
  },
  capabilities: [{
    type: String,
    enum: ['navigation', 'object_detection', 'voice_control', 'remote_monitoring']
  }],
  settings: {
    autoUpdate: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true },
    maxSpeed: { type: Number, default: 1.0, min: 0.1, max: 2.0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
robotSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
robotSchema.index({ owner: 1, status: 1 });
robotSchema.index({ lastSeen: 1 });

module.exports = mongoose.model('Robot', robotSchema);
