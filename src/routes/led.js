const express = require('express');
const router = express.Router();
const Device = require('../models/Device');

// Get LED settings for device
router.get('/:deviceId/settings', async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceId });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // In a real implementation, you'd have a separate LED settings model
    // For now, return default settings
    const ledSettings = {
      enabled: true,
      brightness: 50,
      color: { r: 255, g: 255, b: 255 },
      animation: 'none',
      nightMode: false,
      autoOff: true,
      autoOffDelay: 30 // minutes
    };

    res.json({ ledSettings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update LED settings
router.post('/:deviceId/settings', async (req, res) => {
  try {
    const {
      enabled,
      brightness,
      color,
      animation,
      nightMode,
      autoOff,
      autoOffDelay
    } = req.body;

    // In a real implementation, you'd save this to a LED settings model
    // For now, we'll just acknowledge the update
    const ledSettings = {
      enabled: enabled !== undefined ? enabled : true,
      brightness: brightness || 50,
      color: color || { r: 255, g: 255, b: 255 },
      animation: animation || 'none',
      nightMode: nightMode || false,
      autoOff: autoOff !== undefined ? autoOff : true,
      autoOffDelay: autoOffDelay || 30,
      updatedAt: new Date()
    };

    // Update device status to indicate LED mode
    await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      {
        currentMode: 'lamp',
        updatedAt: new Date()
      }
    );

    res.json({
      success: true,
      ledSettings,
      message: 'LED settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Control LED state (on/off)
router.post('/:deviceId/control', async (req, res) => {
  try {
    const { action, brightness, color } = req.body;

    let response = {};

    switch (action) {
      case 'on':
        response = {
          success: true,
          state: 'on',
          brightness: brightness || 100,
          color: color || { r: 255, g: 255, b: 255 }
        };
        break;

      case 'off':
        response = {
          success: true,
          state: 'off'
        };
        break;

      case 'brightness':
        response = {
          success: true,
          brightness: brightness || 50
        };
        break;

      case 'color':
        response = {
          success: true,
          color: color || { r: 255, g: 255, b: 255 }
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Update device mode
    await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      {
        currentMode: action === 'off' ? 'idle' : 'lamp',
        updatedAt: new Date()
      }
    );

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set LED animation
router.post('/:deviceId/animation', async (req, res) => {
  try {
    const { animation, speed, colors } = req.body;

    const validAnimations = [
      'none', 'fade', 'blink', 'pulse', 'rainbow',
      'color_cycle', 'breathing', 'strobe'
    ];

    if (!validAnimations.includes(animation)) {
      return res.status(400).json({ error: 'Invalid animation type' });
    }

    const animationSettings = {
      animation,
      speed: speed || 1,
      colors: colors || [{ r: 255, g: 255, b: 255 }],
      updatedAt: new Date()
    };

    res.json({
      success: true,
      animationSettings,
      message: `LED animation set to ${animation}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get LED presets
router.get('/:deviceId/presets', async (req, res) => {
  try {
    const presets = [
      {
        id: 'warm_white',
        name: 'Warm White',
        color: { r: 255, g: 223, b: 186 },
        brightness: 80
      },
      {
        id: 'cool_white',
        name: 'Cool White',
        color: { r: 255, g: 255, b: 255 },
        brightness: 100
      },
      {
        id: 'red',
        name: 'Red',
        color: { r: 255, g: 0, b: 0 },
        brightness: 70
      },
      {
        id: 'green',
        name: 'Green',
        color: { r: 0, g: 255, b: 0 },
        brightness: 70
      },
      {
        id: 'blue',
        name: 'Blue',
        color: { r: 0, g: 0, b: 255 },
        brightness: 70
      },
      {
        id: 'purple',
        name: 'Purple',
        color: { r: 128, g: 0, b: 128 },
        brightness: 70
      },
      {
        id: 'night_mode',
        name: 'Night Mode',
        color: { r: 255, g: 165, b: 0 },
        brightness: 20,
        animation: 'fade'
      }
    ];

    res.json({ presets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply LED preset
router.post('/:deviceId/preset/:presetId', async (req, res) => {
  try {
    const { presetId } = req.params;

    // Get preset data (in real implementation, this would come from database)
    const presets = {
      warm_white: { color: { r: 255, g: 223, b: 186 }, brightness: 80 },
      cool_white: { color: { r: 255, g: 255, b: 255 }, brightness: 100 },
      red: { color: { r: 255, g: 0, b: 0 }, brightness: 70 },
      green: { color: { r: 0, g: 255, b: 0 }, brightness: 70 },
      blue: { color: { r: 0, g: 0, b: 255 }, brightness: 70 },
      purple: { color: { r: 128, g: 0, b: 128 }, brightness: 70 },
      night_mode: { color: { r: 255, g: 165, b: 0 }, brightness: 20, animation: 'fade' }
    };

    const preset = presets[presetId];
    if (!preset) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    res.json({
      success: true,
      preset: {
        id: presetId,
        ...preset
      },
      message: `Applied ${presetId} preset`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
