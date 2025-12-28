const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const Robot = require('../models/Robot');

// POST /robot/register - Register a new robot
router.post('/register', verifyFirebaseToken, async (req, res) => {
  try {
    const { robot_id, model, local_ip } = req.body;

    // Validate required fields
    if (!robot_id || !model || !local_ip) {
      return res.status(400).json({
        success: false,
        error: 'robot_id, model, and local_ip are required'
      });
    }

    // Validate model
    if (!['LAC-R', 'GEM'].includes(model)) {
      return res.status(400).json({
        success: false,
        error: 'Model must be either LAC-R or GEM'
      });
    }

    // Check if robot_id already exists
    const existingRobot = await Robot.findOne({ robot_id });
    if (existingRobot) {
      return res.status(409).json({
        success: false,
        error: 'Robot ID already exists'
      });
    }

    // Create new robot (password will be set separately)
    const newRobot = new Robot({
      robot_id,
      owner_uid: req.user.uid,
      model,
      local_ip,
      ip_password_hash: null,
      network_mode: 'AP' // Default to AP mode
    });

    await newRobot.save();

    res.status(201).json({
      success: true,
      message: 'Robot registered successfully'
    });
  } catch (error) {
    console.error('Error registering robot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register robot'
    });
  }
});

// POST /robot/verify-password - Verify robot password
router.post('/verify-password', verifyFirebaseToken, async (req, res) => {
  try {
    const { robot_id, password } = req.body;

    if (!robot_id || !password) {
      return res.status(400).json({
        success: false,
        error: 'robot_id and password are required'
      });
    }

    const robot = await Robot.findOne({ robot_id, owner_uid: req.user.uid });
    if (!robot) {
      return res.status(404).json({
        success: false,
        error: 'Robot not found'
      });
    }

    // Guard: password not set yet
    if (!robot.ip_password_hash) {
      return res.status(400).json({
        success: false,
        error: 'Robot password not set'
      });
    }

    const isValidPassword = await bcrypt.compare(password, robot.ip_password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }

    res.json({
      success: true,
      message: 'Password verified successfully',
      robot: {
        robot_id: robot.robot_id,
        model: robot.model,
        local_ip: robot.local_ip
      }
    });
  } catch (error) {
    console.error('Error verifying password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify password'
    });
  }
});

// GET /robot/dashboard - Get robot details for dashboard
router.get('/dashboard', verifyFirebaseToken, async (req, res) => {
  try {
    const robots = await Robot.find({ owner_uid: req.user.uid });

    if (robots.length === 0) {
      return res.json({
        success: true,
        robot: null,
        message: 'No robots found for this user'
      });
    }

    // For now, return the first robot (can be extended for multi-robot support later)
    const robot = robots[0];

    res.json({
      success: true,
      robot: {
        robot_id: robot.robot_id,
        model: robot.model,
        local_ip: robot.local_ip,
        network_mode: robot.network_mode,
        created_at: robot.created_at,
        // Include GEM status config if robot is GEM model
        ...(robot.model === 'GEM' && { gem_status_config: robot.gem_status_config })
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

// POST /robot/set-password - Set/update robot password
router.post('/set-password', verifyFirebaseToken, async (req, res) => {
  try {
    const { robot_id, new_password } = req.body;

    if (!robot_id || !new_password) {
      return res.status(400).json({
        success: false,
        error: 'robot_id and new_password are required'
      });
    }

    const robot = await Robot.findOne({ robot_id, owner_uid: req.user.uid });
    if (!robot) {
      return res.status(404).json({
        success: false,
        error: 'Robot not found'
      });
    }

    // Hash the new password
    const saltRounds = 10;
    const new_ip_password_hash = await bcrypt.hash(new_password, saltRounds);

    // Update password
    robot.ip_password_hash = new_ip_password_hash;
    await robot.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error setting password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set password'
    });
  }
});

// POST /robot/validate-password - Validate dashboard password
router.post('/validate-password', verifyFirebaseToken, async (req, res) => {
  try {
    const { robot_id, password } = req.body;

    if (!robot_id || !password) {
      return res.status(400).json({
        success: false,
        error: 'robot_id and password are required'
      });
    }

    const robot = await Robot.findOne({ robot_id, owner_uid: req.user.uid });
    if (!robot) {
      return res.status(404).json({
        success: false,
        error: 'Robot not found'
      });
    }

    // Guard: password not set yet
    if (!robot.ip_password_hash) {
      return res.status(400).json({
        success: false,
        error: 'Robot password not set'
      });
    }

    const isValidPassword = await bcrypt.compare(password, robot.ip_password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }

    res.json({
      success: true,
      message: 'Password validated successfully',
      robot: {
        robot_id: robot.robot_id,
        model: robot.model,
        local_ip: robot.local_ip,
        network_mode: robot.network_mode
      }
    });
  } catch (error) {
    console.error('Error validating password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate password'
    });
  }
});

// PUT /robot/update-ip - Update robot IP (additional route for IP changes)
router.put('/update-ip', verifyFirebaseToken, async (req, res) => {
  try {
    const { robot_id, new_ip } = req.body;

    if (!robot_id || !new_ip) {
      return res.status(400).json({
        success: false,
        error: 'robot_id and new_ip are required'
      });
    }

    const robot = await Robot.findOne({ robot_id, owner_uid: req.user.uid });
    if (!robot) {
      return res.status(404).json({
        success: false,
        error: 'Robot not found'
      });
    }

    robot.local_ip = new_ip;
    await robot.save();

    res.json({
      success: true,
      message: 'IP updated successfully',
      robot: {
        robot_id: robot.robot_id,
        local_ip: robot.local_ip
      }
    });
  } catch (error) {
    console.error('Error updating IP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update IP'
    });
  }
});

// GET /robot/gem-status/:robot_id - Get GEM model status configuration
router.get('/gem-status/:robot_id', verifyFirebaseToken, async (req, res) => {
  try {
    const { robot_id } = req.params;

    const robot = await Robot.findOne({ robot_id, owner_uid: req.user.uid });
    if (!robot) {
      return res.status(404).json({
        success: false,
        error: 'Robot not found'
      });
    }

    // Check if robot is GEM model
    if (robot.model !== 'GEM') {
      return res.status(400).json({
        success: false,
        error: 'This endpoint is only for GEM model robots'
      });
    }

    res.json({
      success: true,
      gem_status_config: robot.gem_status_config
    });
  } catch (error) {
    console.error('Error getting GEM status config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get GEM status configuration'
    });
  }
});

// PUT /robot/gem-status/:robot_id - Update GEM model status configuration
router.put('/gem-status/:robot_id', verifyFirebaseToken, async (req, res) => {
  try {
    const { robot_id } = req.params;
    const { battery_level, signal_strength, alert_message } = req.body;

    const robot = await Robot.findOne({ robot_id, owner_uid: req.user.uid });
    if (!robot) {
      return res.status(404).json({
        success: false,
        error: 'Robot not found'
      });
    }

    // Check if robot is GEM model
    if (robot.model !== 'GEM') {
      return res.status(400).json({
        success: false,
        error: 'This endpoint is only for GEM model robots'
      });
    }

    // Update the configurable status fields
    if (battery_level !== undefined) {
      robot.gem_status_config.battery_level = battery_level;
    }
    if (signal_strength !== undefined) {
      robot.gem_status_config.signal_strength = signal_strength;
    }
    if (alert_message !== undefined) {
      robot.gem_status_config.alert_message = alert_message;
    }

    await robot.save();

    res.json({
      success: true,
      message: 'GEM status configuration updated successfully',
      gem_status_config: robot.gem_status_config
    });
  } catch (error) {
    console.error('Error updating GEM status config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update GEM status configuration'
    });
  }
});

// POST /robot/delete - Delete a robot
router.post('/delete', verifyFirebaseToken, async (req, res) => {
  try {
    const { robot_id } = req.body;

    if (!robot_id) {
      return res.status(400).json({
        success: false,
        error: 'robot_id is required'
      });
    }

    const robot = await Robot.findOne({ robot_id, owner_uid: req.user.uid });
    if (!robot) {
      return res.status(404).json({
        success: false,
        error: 'Robot not found'
      });
    }

    await Robot.deleteOne({ robot_id, owner_uid: req.user.uid });

    res.json({
      success: true,
      message: 'Robot deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting robot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete robot'
    });
  }
});

module.exports = router;
