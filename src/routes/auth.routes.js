const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const Robot = require('../models/Robot');

// Verify token endpoint
router.post('/verify', verifyFirebaseToken, async (req, res) => {
  try {
    // Get user's robots
    const robots = await Robot.find({ owner_uid: req.user.uid }).select('robot_id model');

    const robotList = robots.map(robot => ({
      robot_id: robot.robot_id,
      model: robot.model
    }));

    res.json({
      user: {
        firebase_uid: req.user.uid,
        name: req.user.name,
        email: req.user.email,
        has_robot: robots.length > 0
      },
      robots: robotList
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user data'
    });
  }
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
