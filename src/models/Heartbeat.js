const mongoose = require('mongoose');

const heartbeatSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  bpm: {
    type: Number,
    required: true,
    min: 40,
    max: 200
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  quality: {
    type: String,
    enum: ['poor', 'fair', 'good', 'excellent'],
    default: 'good'
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
heartbeatSchema.index({ deviceId: 1, timestamp: -1 });
heartbeatSchema.index({ sessionId: 1, timestamp: 1 });

module.exports = mongoose.model('Heartbeat', heartbeatSchema);
