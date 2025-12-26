const express = require('express');
const router = express.Router();
const Device = require('../models/Device');

// Get WiFi configuration for device
router.get('/:deviceId/config', async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceId });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({
      wifiStatus: device.wifiStatus,
      lastUpdated: device.updatedAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update WiFi configuration
router.post('/:deviceId/config', async (req, res) => {
  try {
    const { ssid, password, security } = req.body;

    // In a real implementation, you would store WiFi credentials securely
    // For now, we'll just update the device status
    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      {
        'wifiStatus.connected': false,
        'wifiStatus.ssid': ssid,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({
      success: true,
      message: 'WiFi configuration updated. Device will attempt to connect.',
      device: {
        deviceId: device.deviceId,
        wifiStatus: device.wifiStatus
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available WiFi networks (this would typically be called by ESP32)
router.get('/:deviceId/networks', async (req, res) => {
  try {
    // In a real implementation, this would scan for networks
    // For now, return mock data
    const networks = [
      { ssid: 'HomeWiFi', signalStrength: -45, security: 'WPA2' },
      { ssid: 'OfficeWiFi', signalStrength: -60, security: 'WPA2' },
      { ssid: 'GuestNetwork', signalStrength: -70, security: 'WPA2' }
    ];

    res.json({ networks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test WiFi connection
router.post('/:deviceId/test', async (req, res) => {
  try {
    const { ssid, password } = req.body;

    // In a real implementation, you would test the connection
    // For now, simulate a test
    const testResult = {
      success: true,
      ping: 25, // ms
      signalStrength: -45,
      ipAddress: '192.168.1.100'
    };

    // Update device WiFi status
    await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      {
        'wifiStatus.connected': true,
        'wifiStatus.ssid': ssid,
        'wifiStatus.signalStrength': testResult.signalStrength,
        updatedAt: new Date()
      }
    );

    res.json({ success: true, testResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disconnect from WiFi
router.post('/:deviceId/disconnect', async (req, res) => {
  try {
    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      {
        'wifiStatus.connected': false,
        'wifiStatus.ssid': '',
        'wifiStatus.signalStrength': 0,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({
      success: true,
      message: 'Disconnected from WiFi',
      wifiStatus: device.wifiStatus
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
