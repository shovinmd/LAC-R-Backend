const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const Robot = require('../models/Robot');

// Get all robots for the authenticated user
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const robots = await Robot.find({ owner: req.user.uid });
    res.json({
      success: true,
      robots: robots
    });
  } catch (error) {
    console.error('Error fetching robots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch robots'
    });
  }
});

// Get a specific robot by ID
router.get('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const robot = await Robot.findOne({
      _id: req.params.id,
      owner: req.user.uid
    });

    if (!robot) {
      return res.status(404).json({
        success: false,
        error: 'Robot not found'
      });
    }

    res.json({
      success: true,
      robot: robot
    });
  } catch (error) {
    console.error('Error fetching robot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch robot'
    });
  }
});

// Create a new robot
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { robotId, name, model, status } = req.body;

    const newRobot = new Robot({
      robotId,
      name,
      model,
      owner: req.user.uid,
      status: status || 'offline'
    });

    const savedRobot = await newRobot.save();

    res.status(201).json({
      success: true,
      robot: savedRobot,
      message: 'Robot created successfully'
    });
  } catch (error) {
    console.error('Error creating robot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create robot'
    });
  }
});

// Update a robot
router.put('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { name, model, status } = req.body;

    const updatedRobot = await Robot.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.uid },
      { name, model, status },
      { new: true }
    );

    if (!updatedRobot) {
      return res.status(404).json({
        success: false,
        error: 'Robot not found'
      });
    }

    res.json({
      success: true,
      robot: updatedRobot,
      message: 'Robot updated successfully'
    });
  } catch (error) {
    console.error('Error updating robot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update robot'
    });
  }
});

// Delete a robot
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const deletedRobot = await Robot.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.uid
    });

    if (!deletedRobot) {
      return res.status(404).json({
        success: false,
        error: 'Robot not found'
      });
    }

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
