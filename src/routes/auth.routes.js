const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');

// Verify token endpoint
router.post('/verify', verifyFirebaseToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: req.user
  });
});

// Login endpoint (Firebase handles authentication on client side)
router.post('/login', (req, res) => {
  res.json({
    success: true,
    message: 'Use Firebase authentication on client side',
    note: 'Authentication is handled by Firebase SDK in the Flutter app'
  });
});

// Logout endpoint
router.post('/logout', verifyFirebaseToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
    user: req.user
  });
});

// Refresh token endpoint
router.post('/refresh', verifyFirebaseToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token refresh endpoint - implementation pending',
    user: req.user
  });
});

module.exports = router;
