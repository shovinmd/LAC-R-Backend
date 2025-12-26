const express = require('express');
const router = express.Router();
const Alarm = require('../models/Alarm');

// Get all alarms for a device
router.get('/:deviceId', async (req, res) => {
  try {
    const alarms = await Alarm.find({ deviceId: req.params.deviceId })
      .sort({ 'time.hour': 1, 'time.minute': 1 });

    res.json({ alarms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new alarm
router.post('/:deviceId', async (req, res) => {
  try {
    const {
      label,
      hour,
      minute,
      enabled,
      repeat,
      snoozeEnabled,
      snoozeDuration,
      soundEnabled,
      vibrationEnabled
    } = req.body;

    const alarm = new Alarm({
      deviceId: req.params.deviceId,
      label,
      time: { hour, minute },
      enabled: enabled !== undefined ? enabled : true,
      repeat: repeat || {},
      snoozeEnabled: snoozeEnabled !== undefined ? snoozeEnabled : true,
      snoozeDuration: snoozeDuration || 5,
      soundEnabled: soundEnabled !== undefined ? soundEnabled : true,
      vibrationEnabled: vibrationEnabled !== undefined ? vibrationEnabled : true
    });

    await alarm.save();

    res.status(201).json({
      success: true,
      alarm
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an alarm
router.put('/:deviceId/:alarmId', async (req, res) => {
  try {
    const {
      label,
      hour,
      minute,
      enabled,
      repeat,
      snoozeEnabled,
      snoozeDuration,
      soundEnabled,
      vibrationEnabled
    } = req.body;

    const alarm = await Alarm.findOneAndUpdate(
      { _id: req.params.alarmId, deviceId: req.params.deviceId },
      {
        label,
        time: { hour, minute },
        enabled,
        repeat,
        snoozeEnabled,
        snoozeDuration,
        soundEnabled,
        vibrationEnabled,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!alarm) {
      return res.status(404).json({ error: 'Alarm not found' });
    }

    res.json({
      success: true,
      alarm
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an alarm
router.delete('/:deviceId/:alarmId', async (req, res) => {
  try {
    const alarm = await Alarm.findOneAndDelete({
      _id: req.params.alarmId,
      deviceId: req.params.deviceId
    });

    if (!alarm) {
      return res.status(404).json({ error: 'Alarm not found' });
    }

    res.json({
      success: true,
      message: 'Alarm deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle alarm enabled/disabled
router.patch('/:deviceId/:alarmId/toggle', async (req, res) => {
  try {
    const alarm = await Alarm.findOne({
      _id: req.params.alarmId,
      deviceId: req.params.deviceId
    });

    if (!alarm) {
      return res.status(404).json({ error: 'Alarm not found' });
    }

    alarm.enabled = !alarm.enabled;
    alarm.updatedAt = new Date();
    await alarm.save();

    res.json({
      success: true,
      alarm
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get next alarm
router.get('/:deviceId/next', async (req, res) => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Find enabled alarms
    const alarms = await Alarm.find({
      deviceId: req.params.deviceId,
      enabled: true
    });

    let nextAlarm = null;
    let soonestTime = null;

    for (const alarm of alarms) {
      const alarmTime = new Date();
      alarmTime.setHours(alarm.time.hour, alarm.time.minute, 0, 0);

      // Check if alarm repeats on current day or find next day
      let daysToAdd = 0;
      if (alarm.repeat && Object.values(alarm.repeat).some(day => day)) {
        // Has repeat settings
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDayName = dayNames[currentDay];

        if (!alarm.repeat[currentDayName]) {
          // Not today, find next day
          for (let i = 1; i <= 7; i++) {
            const checkDay = (currentDay + i) % 7;
            const checkDayName = dayNames[checkDay];
            if (alarm.repeat[checkDayName]) {
              daysToAdd = i;
              break;
            }
          }
        }
      } else {
        // One-time alarm
        if (alarmTime <= now) {
          continue; // Already passed today
        }
      }

      if (daysToAdd > 0) {
        alarmTime.setDate(alarmTime.getDate() + daysToAdd);
      }

      if (!soonestTime || alarmTime < soonestTime) {
        soonestTime = alarmTime;
        nextAlarm = alarm;
      }
    }

    res.json({
      nextAlarm,
      timeUntil: nextAlarm ? soonestTime - now : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
