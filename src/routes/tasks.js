const express = require('express');
const router = express.Router();

// In-memory task store (in production, use database)
let tasks = [
  {
    id: 1,
    deviceId: 'gem001',
    title: 'Welcome to GEM',
    description: 'Get familiar with your new GEM device',
    completed: false,
    priority: 'high',
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Get all tasks for a device
router.get('/:deviceId', (req, res) => {
  try {
    const deviceTasks = tasks.filter(task => task.deviceId === req.params.deviceId);
    res.json({ tasks: deviceTasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new task
router.post('/:deviceId', (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const newTask = {
      id: Date.now(), // Simple ID generation
      deviceId: req.params.deviceId,
      title,
      description: description || '',
      completed: false,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    tasks.push(newTask);

    res.status(201).json({
      success: true,
      task: newTask
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a task
router.put('/:deviceId/:taskId', (req, res) => {
  try {
    const { title, description, completed, priority, dueDate } = req.body;
    const taskId = parseInt(req.params.taskId);

    const taskIndex = tasks.findIndex(
      task => task.id === taskId && task.deviceId === req.params.deviceId
    );

    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update task
    if (title !== undefined) tasks[taskIndex].title = title;
    if (description !== undefined) tasks[taskIndex].description = description;
    if (completed !== undefined) tasks[taskIndex].completed = completed;
    if (priority !== undefined) tasks[taskIndex].priority = priority;
    if (dueDate !== undefined) tasks[taskIndex].dueDate = dueDate ? new Date(dueDate) : null;

    tasks[taskIndex].updatedAt = new Date();

    res.json({
      success: true,
      task: tasks[taskIndex]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a task
router.delete('/:deviceId/:taskId', (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);

    const taskIndex = tasks.findIndex(
      task => task.id === taskId && task.deviceId === req.params.deviceId
    );

    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const deletedTask = tasks.splice(taskIndex, 1)[0];

    res.json({
      success: true,
      message: 'Task deleted successfully',
      task: deletedTask
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle task completion
router.patch('/:deviceId/:taskId/toggle', (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);

    const task = tasks.find(
      task => task.id === taskId && task.deviceId === req.params.deviceId
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.completed = !task.completed;
    task.updatedAt = new Date();

    res.json({
      success: true,
      task
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tasks by priority
router.get('/:deviceId/priority/:priority', (req, res) => {
  try {
    const { priority } = req.params;
    const deviceTasks = tasks.filter(
      task => task.deviceId === req.params.deviceId && task.priority === priority
    );

    res.json({ tasks: deviceTasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get completed tasks
router.get('/:deviceId/completed', (req, res) => {
  try {
    const completedTasks = tasks.filter(
      task => task.deviceId === req.params.deviceId && task.completed
    );

    res.json({ tasks: completedTasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending tasks
router.get('/:deviceId/pending', (req, res) => {
  try {
    const pendingTasks = tasks.filter(
      task => task.deviceId === req.params.deviceId && !task.completed
    );

    res.json({ tasks: pendingTasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get overdue tasks
router.get('/:deviceId/overdue', (req, res) => {
  try {
    const now = new Date();
    const overdueTasks = tasks.filter(
      task => task.deviceId === req.params.deviceId &&
              !task.completed &&
              task.dueDate &&
              new Date(task.dueDate) < now
    );

    res.json({ tasks: overdueTasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk update tasks
router.post('/:deviceId/bulk', (req, res) => {
  try {
    const { action, taskIds } = req.body;

    if (!action || !taskIds || !Array.isArray(taskIds)) {
      return res.status(400).json({ error: 'Action and taskIds array are required' });
    }

    const updatedTasks = [];
    const notFoundIds = [];

    taskIds.forEach(taskId => {
      const task = tasks.find(
        task => task.id === taskId && task.deviceId === req.params.deviceId
      );

      if (task) {
        switch (action) {
          case 'complete':
            task.completed = true;
            break;
          case 'uncomplete':
            task.completed = false;
            break;
          case 'delete':
            const index = tasks.indexOf(task);
            tasks.splice(index, 1);
            break;
          default:
            return; // Skip invalid actions
        }

        if (action !== 'delete') {
          task.updatedAt = new Date();
          updatedTasks.push(task);
        }
      } else {
        notFoundIds.push(taskId);
      }
    });

    res.json({
      success: true,
      message: `Bulk ${action} completed`,
      updatedTasks,
      notFoundIds
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
