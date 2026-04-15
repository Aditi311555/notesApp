const express = require('express');
const router = express.Router();
const Task = require('../models/task');

// ─── GET /api/tasks ───────────────────────────────────────────────────────────
// Retrieve all tasks (supports ?status=pending&priority=high filters)
router.get('/', (req, res) => {
  try {
    const { status, priority } = req.query;
    const tasks = Task.findAll({ status, priority });
    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/tasks/:id ───────────────────────────────────────────────────────
// Retrieve a specific task by ID
router.get('/:id', (req, res) => {
  try {
    const task = Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/tasks ──────────────────────────────────────────────────────────
// Create a new task
router.post('/', (req, res) => {
  try {
    const task = Task.create(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/tasks/:id ───────────────────────────────────────────────────────
// Update an existing task
router.put('/:id', (req, res) => {
  try {
    const task = Task.update(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
// Remove a task
router.delete('/:id', (req, res) => {
  try {
    const deleted = Task.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PATCH /api/tasks/:id/status ──────────────────────────────────────────────
// Quick-update just the status of a task
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'status field is required' });
    }
    const task = Task.update(req.params.id, { status });
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
