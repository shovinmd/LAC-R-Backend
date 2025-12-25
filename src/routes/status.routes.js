const express = require('express');
const router = express.Router();

// Simple status route
router.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Status endpoint is live' });
});

module.exports = router;
