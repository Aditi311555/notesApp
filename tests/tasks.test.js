const request = require('supertest');
const app     = require('../src/app');
const Task    = require('../src/models/task');

// ─────────────────────────────────────────────────────────────────────────────
// Reset in-memory store before each test for isolation
// ─────────────────────────────────────────────────────────────────────────────
beforeEach(() => Task._reset());
afterAll(()  => Task._reset());

// ═════════════════════════════════════════════════════════════════════════════
// 1. Health & Root endpoints
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /health', () => {
  test('returns 200 with status OK', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body).toHaveProperty('timestamp');
  });
});

describe('GET /', () => {
  test('returns welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/TaskFlow/i);
  });
});

describe('GET /unknown-route', () => {
  test('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.statusCode).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. GET /api/tasks
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /api/tasks', () => {
  test('returns empty array when no tasks exist', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
    expect(res.body.count).toBe(0);
  });

  test('returns all tasks', async () => {
    Task.create({ title: 'Task A' });
    Task.create({ title: 'Task B' });
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.data).toHaveLength(2);
  });

  test('filters tasks by status', async () => {
    Task.create({ title: 'Pending task' });
    const t = Task.create({ title: 'Done task' });
    Task.update(t.id, { status: 'completed' });

    const res = await request(app).get('/api/tasks?status=completed');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.every(t => t.status === 'completed')).toBe(true);
  });

  test('filters tasks by priority', async () => {
    Task.create({ title: 'Low task',  priority: 'low' });
    Task.create({ title: 'High task', priority: 'high' });

    const res = await request(app).get('/api/tasks?priority=high');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.every(t => t.priority === 'high')).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. GET /api/tasks/:id
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /api/tasks/:id', () => {
  test('returns a single task by ID', async () => {
    const task = Task.create({ title: 'Specific task', priority: 'high' });
    const res  = await request(app).get(`/api/tasks/${task.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(task.id);
    expect(res.body.data.title).toBe('Specific task');
  });

  test('returns 404 for non-existent ID', async () => {
    const res = await request(app).get('/api/tasks/00000000-dead-beef-0000-000000000000');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. POST /api/tasks
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /api/tasks', () => {
  test('creates a task with required fields', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'New task' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      title:    'New task',
      status:   'pending',
      priority: 'medium'
    });
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.createdAt).toBeDefined();
  });

  test('creates a task with all fields', async () => {
    const payload = {
      title:       'Full task',
      description: 'A complete task with all fields',
      priority:    'high',
      dueDate:     '2025-12-31'
    };
    const res = await request(app).post('/api/tasks').send(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body.data).toMatchObject(payload);
  });

  test('rejects task with missing title', async () => {
    const res = await request(app).post('/api/tasks').send({ priority: 'low' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/title/i);
  });

  test('rejects task with empty title', async () => {
    const res = await request(app).post('/api/tasks').send({ title: '   ' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rejects invalid priority value', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Bad task', priority: 'urgent' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/priority/i);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. PUT /api/tasks/:id
// ═════════════════════════════════════════════════════════════════════════════
describe('PUT /api/tasks/:id', () => {
  test('updates an existing task', async () => {
    const task = Task.create({ title: 'Original title' });
    const res  = await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ title: 'Updated title', status: 'in-progress' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.title).toBe('Updated title');
    expect(res.body.data.status).toBe('in-progress');
  });

  test('returns 404 for non-existent task', async () => {
    const res = await request(app)
      .put('/api/tasks/00000000-0000-0000-0000-000000000000')
      .send({ title: 'Ghost update' });
    expect(res.statusCode).toBe(404);
  });

  test('rejects invalid status value', async () => {
    const task = Task.create({ title: 'Task' });
    const res  = await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ status: 'done' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/status/i);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. DELETE /api/tasks/:id
// ═════════════════════════════════════════════════════════════════════════════
describe('DELETE /api/tasks/:id', () => {
  test('deletes an existing task', async () => {
    const task = Task.create({ title: 'To delete' });
    const res  = await request(app).delete(`/api/tasks/${task.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it no longer exists
    const check = await request(app).get(`/api/tasks/${task.id}`);
    expect(check.statusCode).toBe(404);
  });

  test('returns 404 when deleting non-existent task', async () => {
    const res = await request(app).delete('/api/tasks/00000000-0000-0000-0000-000000000000');
    expect(res.statusCode).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. PATCH /api/tasks/:id/status
// ═════════════════════════════════════════════════════════════════════════════
describe('PATCH /api/tasks/:id/status', () => {
  test('updates only the status field', async () => {
    const task = Task.create({ title: 'Status task' });
    const res  = await request(app)
      .patch(`/api/tasks/${task.id}/status`)
      .send({ status: 'completed' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.title).toBe('Status task'); // title unchanged
  });

  test('returns 400 when status field is missing', async () => {
    const task = Task.create({ title: 'Status task' });
    const res  = await request(app)
      .patch(`/api/tasks/${task.id}/status`)
      .send({});
    expect(res.statusCode).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 8. Task Model unit tests
// ═════════════════════════════════════════════════════════════════════════════
describe('Task Model', () => {
  test('findAll returns empty array initially', () => {
    expect(Task.findAll()).toEqual([]);
  });

  test('findById returns null for unknown ID', () => {
    expect(Task.findById('unknown')).toBeNull();
  });

  test('delete returns false for unknown ID', () => {
    expect(Task.delete('unknown')).toBe(false);
  });

  test('update returns null for unknown ID', () => {
    expect(Task.update('unknown', { title: 'X' })).toBeNull();
  });

  test('create assigns default values correctly', () => {
    const task = Task.create({ title: 'Minimal task' });
    expect(task.status).toBe('pending');
    expect(task.priority).toBe('medium');
    expect(task.description).toBe('');
    expect(task.dueDate).toBeNull();
  });
});
