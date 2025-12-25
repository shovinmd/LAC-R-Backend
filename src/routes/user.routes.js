const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const User = require('../models/User');

// Get all users (admin only)
router.get('/', verifyFirebaseToken, (req, res) => {
  // TODO: Implement user listing with admin check
  res.json({
    success: true,
    message: 'User routes endpoint - implementation pending',
    user: req.user
  });
});

// Get user profile
router.get('/profile', verifyFirebaseToken, (req, res) => {
  res.json({
    success: true,
    message: 'User profile endpoint',
    user: req.user
  });
});

// Update user profile (set username)
router.put('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'name is required' });
    }

    const userDoc = await User.findOne({ firebase_uid: req.user.uid });
    if (!userDoc) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    userDoc.name = name.trim();
    await userDoc.save();

    res.json({
      success: true,
      user: {
        firebase_uid: userDoc.firebase_uid,
        name: userDoc.name,
        email: userDoc.email,
        photo_url: userDoc.photo_url,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

module.exports = router;
