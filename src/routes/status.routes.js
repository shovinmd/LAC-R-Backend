const express = require('express');
const router = express.Router();

// Get server status
router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'LAC-R Backend API'
  });
});

// Get detailed server status
router.get('/detailed', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  res.json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime),
      minutes: Math.floor(uptime / 60),
      hours: Math.floor(uptime / 3600)
    },
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
    },
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    service: 'LAC-R Backend API'
  });
});

module.exports = router;
