const mongoose = require('mongoose');

const geminiChatSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  messageType: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  tokensUsed: {
    type: Number,
    default: 0
  },
  responseTime: {
    type: Number, // milliseconds
    default: 0
  },
  metadata: {
    model: { type: String, default: 'gemini-pro' },
    temperature: { type: Number, default: 0.7 },
    maxTokens: { type: Number, default: 2048 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
geminiChatSchema.index({ deviceId: 1, sessionId: 1, timestamp: 1 });
geminiChatSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model('GeminiChat', geminiChatSchema);
