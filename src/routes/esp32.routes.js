const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const Robot = require('../models/Robot');

// ESP32 Setup Mode Routes (No authentication required for initial setup)

// POST /esp32/setup - ESP32 sends setup information during AP mode
router.post('/setup', async (req, res) => {
  try {
    const { robot_id, model, local_ip, password, ssid, wifi_password } = req.body;

    // Validate required fields
    if (!robot_id || !model || !local_ip || !password) {
      return res.status(400).json({
        success: false,
        error: 'robot_id, model, local_ip, and password are required'
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

    // Hash the password
    const saltRounds = 10;
    const ip_password_hash = await bcrypt.hash(password, saltRounds);

    // Create new robot with setup information
    const newRobot = new Robot({
      robot_id,
      owner_uid: null, // Will be assigned when user claims the robot
      model,
      local_ip,
      ip_password_hash,
      network_mode: 'AP' // Setup mode
    });

    const savedRobot = await newRobot.save();

    res.status(201).json({
      success: true,
      robot: {
        robot_id: savedRobot.robot_id,
        model: savedRobot.model,
        local_ip: savedRobot.local_ip,
        network_mode: savedRobot.network_mode,
        setup_complete: false // Indicates setup mode active
      },
      message: 'ESP32 setup initiated successfully'
    });
  } catch (error) {
    console.error('Error in ESP32 setup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup ESP32'
    });
  }
});

// ESP32 Normal Mode Routes (Require authentication)

// POST /esp32/authenticate - ESP32 authenticates with backend
router.post('/authenticate', async (req, res) => {
  try {
    const { robot_id, password } = req.body;

    if (!robot_id || !password) {
      return res.status(400).json({
        success: false,
        error: 'robot_id and password are required'
      });
    }

    const robot = await Robot.findOne({ robot_id });
    if (!robot) {
      return res.status(404).json({
        success: false,
        error: 'Robot not found'
      });
    }

    // Check if robot is claimed by a user
    if (!robot.owner_uid) {
      return res.status(403).json({
        success: false,
        error: 'Robot not claimed by any user'
      });
    }

    const isValidPassword = await bcrypt.compare(password, robot.ip_password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }

    // Update network mode to normal operation
    robot.network_mode = 'STA'; // Station mode (connected to WiFi)
    await robot.save();

    res.json({
      success: true,
      message: 'ESP32 authenticated successfully',
      robot: {
        robot_id: robot.robot_id,
        model: robot.model,
        local_ip: robot.local_ip,
        network_mode: robot.network_mode,
        owner_uid: robot.owner_uid
      }
    });
  } catch (error) {
    console.error('Error authenticating ESP32:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to authenticate ESP32'
    });
  }
});

// POST /esp32/heartbeat - ESP32 sends heartbeat/status updates
router.post('/heartbeat', async (req, res) => {
  try {
    const { robot_id, status, battery_level, firmware_version } = req.body;

    if (!robot_id) {
      return res.status(400).json({
        success: false,
        error: 'robot_id is required'
      });
    }

    const robot = await Robot.findOne({ robot_id });
    if (!robot) {
      return res.status(404).json({
        success: false,
        error: 'Robot not found'
      });
    }

    // Update robot status (you can extend the Robot model to include these fields)
    // For now, we'll just acknowledge the heartbeat
    console.log(`Heartbeat received from ${robot_id}: status=${status}, battery=${battery_level}, firmware=${firmware_version}`);

    res.json({
      success: true,
      message: 'Heartbeat acknowledged',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process heartbeat'
    });
  }
});

// POST /esp32/command - Send commands to ESP32 (from app via backend)
router.post('/command', async (req, res) => {
  try {
    const { robot_id, command, parameters } = req.body;

    if (!robot_id || !command) {
      return res.status(400).json({
        success: false,
        error: 'robot_id and command are required'
      });
    }

    const robot = await Robot.findOne({ robot_id });
    if (!robot) {
      return res.status(404).json({
        success: false,
        error: 'Robot not found'
      });
    }

    // In a real implementation, you would:
    // 1. Check if ESP32 is online (maybe via WebSocket or MQTT)
    // 2. Forward the command to the ESP32
    // 3. Wait for response

    // For now, we'll simulate command processing
    console.log(`Command ${command} sent to ${robot_id} with params:`, parameters);

    res.json({
      success: true,
      message: `Command ${command} queued for ${robot_id}`,
      command_id: Date.now().toString(), // Would be a real ID in production
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending command:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send command'
    });
  }
});

// GET /esp32/status/:robot_id - Get ESP32 status
router.get('/status/:robot_id', async (req, res) => {
  try {
    const { robot_id } = req.params;

    const robot = await Robot.findOne({ robot_id });
    if (!robot) {
      return res.status(404).json({
        success: false,
        error: 'Robot not found'
      });
    }

    res.json({
      success: true,
      robot: {
        robot_id: robot.robot_id,
        model: robot.model,
        local_ip: robot.local_ip,
        network_mode: robot.network_mode,
        owner_uid: robot.owner_uid,
        created_at: robot.created_at
      }
    });
  } catch (error) {
    console.error('Error getting ESP32 status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ESP32 status'
    });
  }
});

module.exports = router;
