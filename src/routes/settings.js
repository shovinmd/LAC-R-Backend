const express = require('express');
const router = express.Router();
const Device = require('../models/Device');

// Get device settings
router.get('/:deviceId', async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceId });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const settings = {
      deviceName: device.deviceName,
      userName: device.userName,
      firmwareVersion: device.firmwareVersion,
      timeZone: 'UTC', // In real implementation, this would be stored
      language: 'en',
      theme: 'light',
      notifications: {
        sound: true,
        vibration: true,
        led: true
      },
      power: {
        autoSleep: true,
        sleepTimeout: 30, // minutes
        batteryWarning: 20 // percentage
      },
      display: {
        brightness: 80,
        timeout: 60 // seconds
      }
    };

    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update device settings
router.put('/:deviceId', async (req, res) => {
  try {
    const {
      deviceName,
      userName,
      timeZone,
      language,
      theme,
      notifications,
      power,
      display
    } = req.body;

    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      {
        deviceName: deviceName || 'GEM',
        userName: userName || 'User',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const updatedSettings = {
      deviceName: device.deviceName,
      userName: device.userName,
      timeZone: timeZone || 'UTC',
      language: language || 'en',
      theme: theme || 'light',
      notifications: notifications || {
        sound: true,
        vibration: true,
        led: true
      },
      power: power || {
        autoSleep: true,
        sleepTimeout: 30,
        batteryWarning: 20
      },
      display: display || {
        brightness: 80,
        timeout: 60
      },
      updatedAt: new Date()
    };

    res.json({
      success: true,
      settings: updatedSettings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset device to factory settings
router.post('/:deviceId/factory-reset', async (req, res) => {
  try {
    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      {
        deviceName: 'GEM',
        userName: 'User',
        status: 'offline',
        batteryLevel: 100,
        wifiStatus: {
          connected: false,
          ssid: '',
          signalStrength: 0
        },
        currentMode: 'idle',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({
      success: true,
      message: 'Device reset to factory settings',
      device: {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        userName: device.userName,
        status: device.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get device info
router.get('/:deviceId/info', async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceId });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const deviceInfo = {
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      firmwareVersion: device.firmwareVersion,
      hardwareVersion: '1.0',
      serialNumber: `GEM-${device.deviceId.slice(-8).toUpperCase()}`,
      manufacturedDate: device.createdAt,
      lastSeen: device.lastSeen,
      uptime: 0, // Would be calculated from device data
      memory: {
        total: 524288, // bytes
        used: 0,
        free: 0
      },
      storage: {
        total: 2097152, // bytes (SPIFFS)
        used: 0,
        free: 0
      }
    };

    res.json({ deviceInfo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update firmware (OTA)
router.post('/:deviceId/firmware', async (req, res) => {
  try {
    const { firmwareUrl, version } = req.body;

    if (!firmwareUrl) {
      return res.status(400).json({ error: 'Firmware URL is required' });
    }

    // In a real implementation, this would initiate OTA update
    // For now, just acknowledge the request

    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      {
        currentMode: 'updating',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({
      success: true,
      message: 'Firmware update initiated',
      firmwareUrl,
      version: version || 'latest',
      status: 'downloading'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get firmware update status
router.get('/:deviceId/firmware/status', async (req, res) => {
  try {
    // In a real implementation, this would check OTA progress
    const updateStatus = {
      status: 'idle', // idle, downloading, installing, complete, failed
      progress: 0, // percentage
      currentVersion: '1.0.0',
      availableVersion: '1.1.0',
      lastChecked: new Date()
    };

    res.json({ updateStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync time with device
router.post('/:deviceId/time', async (req, res) => {
  try {
    const { timezone, ntpServer } = req.body;

    const timeSettings = {
      timezone: timezone || 'UTC',
      ntpServer: ntpServer || 'pool.ntp.org',
      syncedAt: new Date()
    };

    res.json({
      success: true,
      timeSettings,
      message: 'Time synchronization initiated'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Backup device data
router.post('/:deviceId/backup', async (req, res) => {
  try {
    // In a real implementation, this would create a backup of all device data
    const backupData = {
      timestamp: new Date(),
      deviceId: req.params.deviceId,
      status: 'creating'
    };

    res.json({
      success: true,
      backup: backupData,
      message: 'Backup initiated'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restore device data
router.post('/:deviceId/restore', async (req, res) => {
  try {
    const { backupData } = req.body;

    if (!backupData) {
      return res.status(400).json({ error: 'Backup data is required' });
    }

    // In a real implementation, this would restore device data
    res.json({
      success: true,
      message: 'Device data restore initiated',
      status: 'restoring'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
