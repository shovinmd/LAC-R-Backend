const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const Robot = require('../models/Robot');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Verify token endpoint
router.post('/verify', verifyFirebaseToken, async (req, res) => {
  try {
    // Ensure user doc exists
    let userDoc = await User.findOne({ firebase_uid: req.user.uid });
    if (!userDoc) {
      // Fallback: find by email to avoid duplicate email unique index errors
      const existingByEmail = await User.findOne({ email: req.user.email });
      if (existingByEmail) {
        // Merge account: attach the current firebase_uid and update last_login
        existingByEmail.firebase_uid = req.user.uid;
        if (!existingByEmail.name) {
          existingByEmail.name = req.user.displayName || req.user.name || 'Unknown';
        }
        if (!existingByEmail.photo_url && req.user.photoURL) {
          existingByEmail.photo_url = req.user.photoURL;
        }
        existingByEmail.last_login = new Date();
        await existingByEmail.save();
        userDoc = existingByEmail;
      } else {
        userDoc = await User.create({
          firebase_uid: req.user.uid,
          name: req.user.displayName || req.user.name || 'Unknown',
          email: req.user.email,
          photo_url: req.user.photoURL || null,
          model_selected: false,
          model: null,
          dashboard_lock_enabled: true,
          dashboard_pin_hash: null,
          has_robot: false,
          robot_id: null,
          created_at: new Date(),
          last_login: new Date(),
        });
      }
    } else {
      userDoc.last_login = new Date();
      await userDoc.save();
    }

    // Get user's robots
    const robots = await Robot.find({ owner_uid: req.user.uid }).select('robot_id model');
    const robotList = robots.map(robot => ({
      robot_id: robot.robot_id,
      model: robot.model
    }));

    // Update has_robot and primary robot_id
    const hasRobot = robots.length > 0;
    const primaryRobotId = hasRobot ? robots[0].robot_id : null;
    if (userDoc.has_robot !== hasRobot || userDoc.robot_id !== primaryRobotId) {
      userDoc.has_robot = hasRobot;
      userDoc.robot_id = primaryRobotId;
      await userDoc.save();
    }

    res.json({
      success: true,
      user: {
        firebase_uid: userDoc.firebase_uid,
        email: userDoc.email,
        name: userDoc.name,
        photo_url: userDoc.photo_url,
        model_selected: userDoc.model_selected,
        model: userDoc.model,
        dashboard_lock_enabled: userDoc.dashboard_lock_enabled,
        dashboard_pin_hash: userDoc.dashboard_pin_hash, // presence indicates "set"
        has_robot: userDoc.has_robot,
        robot_id: userDoc.robot_id,
        created_at: userDoc.created_at,
        last_login: userDoc.last_login,
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

router.post('/dashboard-lock/set', verifyFirebaseToken, async (req, res) => {
  try {
    const { password, pin } = req.body;
    const lockValue = password || pin;
    if (!lockValue) {
      return res.status(400).json({ success: false, error: 'password or pin is required' });
    }

    const userDoc = await User.findOne({ firebase_uid: req.user.uid });
    if (!userDoc) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(lockValue, saltRounds);

    userDoc.dashboard_lock_enabled = true;
    userDoc.dashboard_pin_hash = hash;
    await userDoc.save();

    res.json({ success: true, message: 'Dashboard lock set successfully' });
  } catch (error) {
    console.error('Error setting dashboard lock:', error);
    res.status(500).json({ success: false, error: 'Failed to set dashboard lock' });
  }
});

router.post('/dashboard-lock/validate', verifyFirebaseToken, async (req, res) => {
  try {
    const { password, pin } = req.body;
    const lockValue = password || pin;
    if (!lockValue) {
      return res.status(400).json({ success: false, error: 'password or pin is required' });
    }

    const userDoc = await User.findOne({ firebase_uid: req.user.uid });
    if (!userDoc) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const hash = userDoc.dashboard_pin_hash;
    if (!hash) {
      return res.status(400).json({ success: false, error: 'Dashboard lock is not set' });
    }

    const isValid = await bcrypt.compare(lockValue, hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid lock' });
    }

    // Return model for routing (first robot for now; scalable later)
    const robot = await Robot.findOne({ owner_uid: req.user.uid }).select('model');
    res.json({
      success: true,
      model: robot?.model || null,
    });
  } catch (error) {
    console.error('Error validating dashboard lock:', error);
    res.status(500).json({ success: false, error: 'Failed to validate dashboard lock' });
  }
});

router.post('/dashboard-lock/toggle', verifyFirebaseToken, async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, error: 'enabled (boolean) is required' });
    }

    const userDoc = await User.findOne({ firebase_uid: req.user.uid });
    if (!userDoc) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    userDoc.dashboard_lock_enabled = enabled;
    await userDoc.save();

    return res.json({ success: true, enabled });
  } catch (error) {
    console.error('Error toggling dashboard lock:', error);
    return res.status(500).json({ success: false, error: 'Failed to toggle dashboard lock' });
  }
});

// NEW: select model endpoint
router.post('/model/select', verifyFirebaseToken, async (req, res) => {
  try {
    const { model } = req.body;
    if (!['LAC-R', 'GEM'].includes(model)) {
      return res.status(400).json({ success: false, error: 'model must be LAC-R or GEM' });
    }

    const userDoc = await User.findOne({ firebase_uid: req.user.uid });
    if (!userDoc) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    userDoc.model_selected = true;
    userDoc.model = model;
    await userDoc.save();

    return res.json({ success: true, model });
  } catch (error) {
    console.error('Error selecting model:', error);
    return res.status(500).json({ success: false, error: 'Failed to select model' });
  }
});

module.exports = router;
