const mongoose = require('mongoose');

const alarmSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  time: {
    hour: {
      type: Number,
      required: true,
      min: 0,
      max: 23
    },
    minute: {
      type: Number,
      required: true,
      min: 0,
      max: 59
    }
  },
  enabled: {
    type: Boolean,
    default: true
  },
  repeat: {
    monday: { type: Boolean, default: false },
    tuesday: { type: Boolean, default: false },
    wednesday: { type: Boolean, default: false },
    thursday: { type: Boolean, default: false },
    friday: { type: Boolean, default: false },
    saturday: { type: Boolean, default: false },
    sunday: { type: Boolean, default: false }
  },
  snoozeEnabled: {
    type: Boolean,
    default: true
  },
  snoozeDuration: {
    type: Number, // minutes
    default: 5
  },
  soundEnabled: {
    type: Boolean,
    default: true
  },
  vibrationEnabled: {
    type: Boolean,
    default: true
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
alarmSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient querying
alarmSchema.index({ deviceId: 1, 'time.hour': 1, 'time.minute': 1 });

module.exports = mongoose.model('Alarm', alarmSchema);
