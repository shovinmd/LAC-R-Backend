const express = require('express');
const router = express.Router();
const GeminiChat = require('../models/GeminiChat');

// Get chat sessions for device
router.get('/:deviceId/sessions', async (req, res) => {
  try {
    const sessions = await GeminiChat.aggregate([
      { $match: { deviceId: req.params.deviceId } },
      {
        $group: {
          _id: '$sessionId',
          messageCount: { $sum: 1 },
          firstMessage: { $min: '$timestamp' },
          lastMessage: { $max: '$timestamp' },
          totalTokens: { $sum: '$tokensUsed' }
        }
      },
      {
        $project: {
          sessionId: '$_id',
          messageCount: 1,
          firstMessage: 1,
          lastMessage: 1,
          totalTokens: 1,
          _id: 0
        }
      },
      { $sort: { lastMessage: -1 } }
    ]);

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat history for a session
router.get('/:deviceId/session/:sessionId', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const messages = await GeminiChat.find({
      deviceId: req.params.deviceId,
      sessionId: req.params.sessionId
    })
    .sort({ timestamp: 1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message to Gemini
router.post('/:deviceId/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const currentSessionId = sessionId || `session_${Date.now()}`;

    // Save user message
    const userMessage = new GeminiChat({
      deviceId: req.params.deviceId,
      sessionId: currentSessionId,
      messageType: 'user',
      message,
      tokensUsed: Math.floor(message.length / 4), // Rough token estimation
      responseTime: 0
    });

    await userMessage.save();

    // Simulate Gemini response (in real implementation, call Gemini API)
    const geminiResponse = generateGeminiResponse(message);
    const responseTime = Math.random() * 2000 + 1000; // 1-3 seconds

    // Save assistant message
    const assistantMessage = new GeminiChat({
      deviceId: req.params.deviceId,
      sessionId: currentSessionId,
      messageType: 'assistant',
      message: geminiResponse,
      tokensUsed: Math.floor(geminiResponse.length / 4),
      responseTime,
      metadata: {
        model: 'gemini-pro',
        temperature: 0.7,
        maxTokens: 2048
      }
    });

    await assistantMessage.save();

    res.json({
      success: true,
      sessionId: currentSessionId,
      messages: [userMessage, assistantMessage],
      response: geminiResponse
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete chat session
router.delete('/:deviceId/session/:sessionId', async (req, res) => {
  try {
    const result = await GeminiChat.deleteMany({
      deviceId: req.params.deviceId,
      sessionId: req.params.sessionId
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} messages from session`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat statistics
router.get('/:deviceId/stats', async (req, res) => {
  try {
    const stats = await GeminiChat.aggregate([
      { $match: { deviceId: req.params.deviceId } },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          totalTokens: { $sum: '$tokensUsed' },
          avgResponseTime: { $avg: '$responseTime' },
          totalSessions: { $addToSet: '$sessionId' }
        }
      },
      {
        $project: {
          totalMessages: 1,
          totalTokens: 1,
          avgResponseTime: { $round: ['$avgResponseTime', 0] },
          totalSessions: { $size: '$totalSessions' },
          _id: 0
        }
      }
    ]);

    const chatStats = stats[0] || {
      totalMessages: 0,
      totalTokens: 0,
      avgResponseTime: 0,
      totalSessions: 0
    };

    res.json({ stats: chatStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all chat history for device
router.delete('/:deviceId/history', async (req, res) => {
  try {
    const result = await GeminiChat.deleteMany({
      deviceId: req.params.deviceId
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} messages from chat history`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export chat session
router.get('/:deviceId/session/:sessionId/export', async (req, res) => {
  try {
    const messages = await GeminiChat.find({
      deviceId: req.params.deviceId,
      sessionId: req.params.sessionId
    })
    .sort({ timestamp: 1 });

    const exportData = {
      sessionId: req.params.sessionId,
      deviceId: req.params.deviceId,
      exportDate: new Date(),
      messages: messages.map(msg => ({
        type: msg.messageType,
        message: msg.message,
        timestamp: msg.timestamp,
        tokensUsed: msg.tokensUsed
      }))
    };

    res.json(exportData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search chat history
router.get('/:deviceId/search', async (req, res) => {
  try {
    const { query, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const messages = await GeminiChat.find({
      deviceId: req.params.deviceId,
      message: { $regex: query, $options: 'i' }
    })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .select('sessionId messageType message timestamp');

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent conversations
router.get('/:deviceId/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentMessages = await GeminiChat.aggregate([
      { $match: { deviceId: req.params.deviceId } },
      { $sort: { timestamp: -1 } },
      { $limit: parseInt(limit) },
      {
        $group: {
          _id: '$sessionId',
          latestMessage: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestMessage' }
      },
      { $sort: { timestamp: -1 } }
    ]);

    res.json({ conversations: recentMessages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simulate Gemini API response (replace with actual API call)
function generateGeminiResponse(userMessage) {
  const responses = [
    "That's an interesting point! Can you tell me more about that?",
    "I understand what you're saying. How does that make you feel?",
    "That's a great question. Let me think about that for a moment.",
    "I see your perspective. Have you considered looking at it from another angle?",
    "That's fascinating! What led you to that conclusion?",
    "I appreciate you sharing that with me. What's your next step?",
    "That's a complex topic. What aspect interests you most?",
    "I hear what you're saying. How can I help you with that?",
    "That's a thoughtful observation. What do you think might happen next?",
    "I understand. Is there anything specific you'd like to explore further?"
  ];

  // Simple keyword-based responses
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! How are you doing today? I'm here to chat and help with anything you need.";
  }

  if (lowerMessage.includes('how are you')) {
    return "I'm doing well, thank you for asking! I'm here and ready to have a great conversation with you.";
  }

  if (lowerMessage.includes('thank you') || lowerMessage.includes('thanks')) {
    return "You're very welcome! I'm glad I could help. Is there anything else you'd like to talk about?";
  }

  if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
    return "Goodbye! It was great chatting with you. Feel free to come back anytime!";
  }

  if (lowerMessage.includes('help')) {
    return "I'm here to help! I can chat about almost anything - your thoughts, feelings, ideas, or just about life in general. What would you like to talk about?";
  }

  // Return random response
  return responses[Math.floor(Math.random() * responses.length)];
}

module.exports = router;
