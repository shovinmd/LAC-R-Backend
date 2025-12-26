const express = require('express');
const router = express.Router();
const Device = require('../models/Device');

// Get buzzer settings for device
router.get('/:deviceId/settings', async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceId });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // In a real implementation, you'd have a separate buzzer settings model
    // For now, return default settings
    const buzzerSettings = {
      enabled: true,
      volume: 70, // percentage
      patterns: {
        alarm: {
          frequency: 800,
          duration: 500,
          repeat: 3,
          interval: 200
        },
        notification: {
          frequency: 1000,
          duration: 200,
          repeat: 1,
          interval: 0
        },
        heartbeat: {
          frequency: 600,
          duration: 100,
          repeat: 2,
          interval: 50
        },
        button_press: {
          frequency: 1200,
          duration: 50,
          repeat: 1,
          interval: 0
        }
      }
    };

    res.json({ buzzerSettings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update buzzer settings
router.post('/:deviceId/settings', async (req, res) => {
  try {
    const { enabled, volume, patterns } = req.body;

    const buzzerSettings = {
      enabled: enabled !== undefined ? enabled : true,
      volume: volume || 70,
      patterns: patterns || {},
      updatedAt: new Date()
    };

    res.json({
      success: true,
      buzzerSettings,
      message: 'Buzzer settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Play buzzer pattern
router.post('/:deviceId/play', async (req, res) => {
  try {
    const { pattern, customFrequency, customDuration, customRepeat } = req.body;

    let buzzerCommand = {};

    if (pattern) {
      // Use predefined pattern
      const patterns = {
        alarm: { frequency: 800, duration: 500, repeat: 3, interval: 200 },
        notification: { frequency: 1000, duration: 200, repeat: 1, interval: 0 },
        heartbeat: { frequency: 600, duration: 100, repeat: 2, interval: 50 },
        button_press: { frequency: 1200, duration: 50, repeat: 1, interval: 0 },
        success: { frequency: 800, duration: 100, repeat: 2, interval: 100 },
        error: { frequency: 400, duration: 300, repeat: 1, interval: 0 },
        warning: { frequency: 600, duration: 200, repeat: 2, interval: 150 }
      };

      buzzerCommand = patterns[pattern];
      if (!buzzerCommand) {
        return res.status(400).json({ error: 'Invalid pattern' });
      }
    } else if (customFrequency && customDuration) {
      // Use custom parameters
      buzzerCommand = {
        frequency: customFrequency,
        duration: customDuration,
        repeat: customRepeat || 1,
        interval: 0
      };
    } else {
      return res.status(400).json({ error: 'Either pattern or custom parameters required' });
    }

    // Update device mode to indicate buzzer activity
    await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      {
        currentMode: 'alarm', // Assuming buzzer is used for alarms
        updatedAt: new Date()
      }
    );

    res.json({
      success: true,
      buzzerCommand,
      message: `Playing buzzer pattern: ${pattern || 'custom'}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop buzzer
router.post('/:deviceId/stop', async (req, res) => {
  try {
    // In a real implementation, this would send a stop command to the device
    res.json({
      success: true,
      message: 'Buzzer stopped'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test buzzer
router.post('/:deviceId/test', async (req, res) => {
  try {
    const { frequency = 800, duration = 200 } = req.body;

    const testCommand = {
      frequency,
      duration,
      repeat: 1,
      interval: 0,
      test: true
    };

    res.json({
      success: true,
      testCommand,
      message: 'Buzzer test initiated'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get buzzer patterns
router.get('/:deviceId/patterns', async (req, res) => {
  try {
    const patterns = [
      {
        id: 'alarm',
        name: 'Alarm',
        description: 'Urgent alarm sound',
        frequency: 800,
        duration: 500,
        repeat: 3,
        interval: 200
      },
      {
        id: 'notification',
        name: 'Notification',
        description: 'General notification',
        frequency: 1000,
        duration: 200,
        repeat: 1,
        interval: 0
      },
      {
        id: 'heartbeat',
        name: 'Heartbeat',
        description: 'Heartbeat monitoring sound',
        frequency: 600,
        duration: 100,
        repeat: 2,
        interval: 50
      },
      {
        id: 'button_press',
        name: 'Button Press',
        description: 'UI interaction feedback',
        frequency: 1200,
        duration: 50,
        repeat: 1,
        interval: 0
      },
      {
        id: 'success',
        name: 'Success',
        description: 'Positive feedback',
        frequency: 800,
        duration: 100,
        repeat: 2,
        interval: 100
      },
      {
        id: 'error',
        name: 'Error',
        description: 'Error indication',
        frequency: 400,
        duration: 300,
        repeat: 1,
        interval: 0
      },
      {
        id: 'warning',
        name: 'Warning',
        description: 'Warning signal',
        frequency: 600,
        duration: 200,
        repeat: 2,
        interval: 150
      }
    ];

    res.json({ patterns });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create custom buzzer pattern
router.post('/:deviceId/patterns', async (req, res) => {
  try {
    const { name, description, frequency, duration, repeat, interval } = req.body;

    if (!name || !frequency || !duration) {
      return res.status(400).json({ error: 'Name, frequency, and duration are required' });
    }

    const customPattern = {
      id: `custom_${Date.now()}`,
      name,
      description: description || '',
      frequency,
      duration,
      repeat: repeat || 1,
      interval: interval || 0,
      custom: true,
      createdAt: new Date()
    };

    // In a real implementation, save to database
    res.status(201).json({
      success: true,
      pattern: customPattern,
      message: 'Custom buzzer pattern created'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get buzzer status
router.get('/:deviceId/status', async (req, res) => {
  try {
    // In a real implementation, this would query the device
    const buzzerStatus = {
      isPlaying: false,
      currentPattern: null,
      volume: 70,
      lastPlayed: new Date(Date.now() - 300000), // 5 minutes ago
      batteryLevel: 85 // Assuming device has battery info
    };

    res.json({ buzzerStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set buzzer volume
router.post('/:deviceId/volume', async (req, res) => {
  try {
    const { volume } = req.body;

    if (volume < 0 || volume > 100) {
      return res.status(400).json({ error: 'Volume must be between 0 and 100' });
    }

    res.json({
      success: true,
      volume,
      message: `Buzzer volume set to ${volume}%`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
