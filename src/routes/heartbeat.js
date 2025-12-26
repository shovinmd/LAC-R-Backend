const express = require('express');
const router = express.Router();
const Heartbeat = require('../models/Heartbeat');

// Get heartbeat data for device
router.get('/:deviceId', async (req, res) => {
  try {
    const { limit = 50, sessionId } = req.query;

    let query = { deviceId: req.params.deviceId };
    if (sessionId) {
      query.sessionId = sessionId;
    }

    const heartbeatData = await Heartbeat.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({ heartbeatData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new heartbeat reading
router.post('/:deviceId', async (req, res) => {
  try {
    const { bpm, sessionId, quality, notes } = req.body;

    if (!bpm || bpm < 40 || bpm > 200) {
      return res.status(400).json({ error: 'Valid BPM value (40-200) is required' });
    }

    const heartbeat = new Heartbeat({
      deviceId: req.params.deviceId,
      bpm,
      sessionId: sessionId || `session_${Date.now()}`,
      quality: quality || 'good',
      notes
    });

    await heartbeat.save();

    res.status(201).json({
      success: true,
      heartbeat
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get heartbeat statistics
router.get('/:deviceId/stats', async (req, res) => {
  try {
    const { period = '24h' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const stats = await Heartbeat.aggregate([
      {
        $match: {
          deviceId: req.params.deviceId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgBpm: { $avg: '$bpm' },
          minBpm: { $min: '$bpm' },
          maxBpm: { $max: '$bpm' },
          latestReading: { $max: '$timestamp' },
          readings: { $push: { bpm: '$bpm', timestamp: '$timestamp' } }
        }
      },
      {
        $project: {
          _id: 0,
          count: 1,
          avgBpm: { $round: ['$avgBpm', 1] },
          minBpm: 1,
          maxBpm: 1,
          latestReading: 1,
          period
        }
      }
    ]);

    const heartbeatStats = stats[0] || {
      count: 0,
      avgBpm: 0,
      minBpm: 0,
      maxBpm: 0,
      latestReading: null,
      period
    };

    // Calculate heart rate zones (simplified)
    if (heartbeatStats.avgBpm > 0) {
      const avgBpm = heartbeatStats.avgBpm;
      heartbeatStats.zones = {
        fatBurn: { min: 50, max: 69, percentage: Math.min(100, Math.max(0, ((avgBpm - 50) / 19) * 100)) },
        cardio: { min: 70, max: 85, percentage: Math.min(100, Math.max(0, ((avgBpm - 70) / 15) * 100)) },
        peak: { min: 85, max: 100, percentage: Math.min(100, Math.max(0, ((avgBpm - 85) / 15) * 100)) }
      };
    }

    res.json({ stats: heartbeatStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get heartbeat sessions
router.get('/:deviceId/sessions', async (req, res) => {
  try {
    const sessions = await Heartbeat.aggregate([
      { $match: { deviceId: req.params.deviceId } },
      {
        $group: {
          _id: '$sessionId',
          readingCount: { $sum: 1 },
          avgBpm: { $avg: '$bpm' },
          minBpm: { $min: '$bpm' },
          maxBpm: { $max: '$bpm' },
          startTime: { $min: '$timestamp' },
          endTime: { $max: '$timestamp' },
          duration: { $subtract: [{ $max: '$timestamp' }, { $min: '$timestamp' }] }
        }
      },
      {
        $project: {
          sessionId: '$_id',
          readingCount: 1,
          avgBpm: { $round: ['$avgBpm', 1] },
          minBpm: 1,
          maxBpm: 1,
          startTime: 1,
          endTime: 1,
          duration: 1,
          _id: 0
        }
      },
      { $sort: { startTime: -1 } }
    ]);

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete heartbeat data
router.delete('/:deviceId', async (req, res) => {
  try {
    const { sessionId, beforeDate } = req.query;

    let query = { deviceId: req.params.deviceId };

    if (sessionId) {
      query.sessionId = sessionId;
    }

    if (beforeDate) {
      query.timestamp = { $lt: new Date(beforeDate) };
    }

    const result = await Heartbeat.deleteMany(query);

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} heartbeat readings`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get latest heartbeat reading
router.get('/:deviceId/latest', async (req, res) => {
  try {
    const latestReading = await Heartbeat.findOne({
      deviceId: req.params.deviceId
    })
    .sort({ timestamp: -1 });

    if (!latestReading) {
      return res.status(404).json({ error: 'No heartbeat readings found' });
    }

    res.json({ latestReading });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start heartbeat monitoring session
router.post('/:deviceId/session/start', async (req, res) => {
  try {
    const sessionId = `session_${Date.now()}`;

    // In a real implementation, this would send a command to the ESP32 to start monitoring
    res.json({
      success: true,
      sessionId,
      message: 'Heartbeat monitoring session started',
      startTime: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop heartbeat monitoring session
router.post('/:deviceId/session/stop', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Get session stats
    const sessionStats = await Heartbeat.aggregate([
      {
        $match: {
          deviceId: req.params.deviceId,
          sessionId
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgBpm: { $avg: '$bpm' },
          minBpm: { $min: '$bpm' },
          maxBpm: { $max: '$bpm' },
          startTime: { $min: '$timestamp' },
          endTime: { $max: '$timestamp' }
        }
      }
    ]);

    const stats = sessionStats[0] || {
      count: 0,
      avgBpm: 0,
      minBpm: 0,
      maxBpm: 0
    };

    res.json({
      success: true,
      sessionId,
      message: 'Heartbeat monitoring session stopped',
      stats: {
        readingCount: stats.count,
        avgBpm: Math.round(stats.avgBpm * 10) / 10,
        minBpm: stats.minBpm,
        maxBpm: stats.maxBpm,
        duration: stats.startTime && stats.endTime ?
          stats.endTime - stats.startTime : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get heartbeat trends
router.get('/:deviceId/trends', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Group readings by day
    const dailyStats = await Heartbeat.aggregate([
      {
        $match: {
          deviceId: req.params.deviceId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          avgBpm: { $avg: '$bpm' },
          minBpm: { $min: '$bpm' },
          maxBpm: { $max: '$bpm' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          date: '$_id',
          avgBpm: { $round: ['$avgBpm', 1] },
          minBpm: 1,
          maxBpm: 1,
          count: 1,
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({ trends: dailyStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
