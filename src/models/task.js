const { v4: uuidv4 } = require('uuid');

// In-memory data store (acts as a simple database for this project)
let tasks = [];

const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_STATUSES   = ['pending', 'in-progress', 'completed'];

/**
 * Task Model — encapsulates all CRUD operations
 */
const Task = {
  /**
   * Return all tasks, optionally filtered by status or priority
   */
  findAll(filter = {}) {
    let result = [...tasks];
    if (filter.status)   result = result.filter(t => t.status === filter.status);
    if (filter.priority) result = result.filter(t => t.priority === filter.priority);
    return result;
  },

  /**
   * Find a single task by ID
   */
  findById(id) {
    return tasks.find(t => t.id === id) || null;
  },

  /**
   * Create and persist a new task
   */
  create({ title, description = '', priority = 'medium', dueDate = null }) {
    if (!title || typeof title !== 'string' || title.trim() === '') {
      throw new Error('Title is required and must be a non-empty string');
    }
    if (!VALID_PRIORITIES.includes(priority)) {
      throw new Error(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }

    const task = {
      id:          uuidv4(),
      title:       title.trim(),
      description: description.trim(),
      priority,
      status:      'pending',
      dueDate:     dueDate || null,
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString()
    };

    tasks.push(task);
    return task;
  },

  /**
   * Update fields on an existing task
   */
  update(id, updates) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    const { title, description, priority, status, dueDate } = updates;

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        throw new Error('Title must be a non-empty string');
      }
      tasks[index].title = title.trim();
    }
    if (description !== undefined) tasks[index].description = description;
    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority)) {
        throw new Error(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
      }
      tasks[index].priority = priority;
    }
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        throw new Error(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
      }
      tasks[index].status = status;
    }
    if (dueDate !== undefined) tasks[index].dueDate = dueDate;

    tasks[index].updatedAt = new Date().toISOString();
    return tasks[index];
  },

  /**
   * Delete a task by ID
   */
  delete(id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return false;
    tasks.splice(index, 1);
    return true;
  },

  /**
   * Reset store (used in tests)
   */
  _reset() {
    tasks = [];
  }
};

module.exports = Task;
