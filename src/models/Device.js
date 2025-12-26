const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  deviceName: {
    type: String,
    default: 'GEM'
  },
  userName: {
    type: String,
    default: 'User'
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
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
  wifiStatus: {
    connected: { type: Boolean, default: false },
    ssid: { type: String, default: '' },
    signalStrength: { type: Number, default: 0 }
  },
  currentMode: {
    type: String,
    enum: ['idle', 'heartbeat', 'lamp', 'alarm', 'wifi_setup', 'gemini'],
    default: 'idle'
  },
  firmwareVersion: {
    type: String,
    default: '1.0.0'
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
deviceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Device', deviceSchema);
