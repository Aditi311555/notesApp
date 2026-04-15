# TaskFlow API — DevOps Mini Project

> A lightweight Task Manager REST API demonstrating a complete CI/CD pipeline using Node.js, GitHub Actions, Docker, and Docker Compose.

---

## Problem Statement

Manual software deployments are error-prone, time-consuming, and inconsistent across environments. Developers spend significant effort on repetitive tasks like running tests, building images, and deploying manually. This project solves that by implementing a **fully automated DevOps pipeline** for a Task Manager REST API — from code commit to staging deployment — with zero manual intervention.

**Objectives:**
- Implement full CRUD REST API for task management
- Automate build, test, and lint on every commit
- Containerize the application using Docker (multi-stage builds)
- Deploy automatically to a staging environment on merge to `main`

---

## Architecture

```
Developer
    │ git push
    ▼
GitHub Repository
    │
    ├─► GitHub Actions CI/CD Pipeline
    │       │
    │       ├─ [Job 1] Lint (ESLint)
    │       ├─ [Job 2] Test (Jest + Coverage) ─── Matrix: Node 18, 20
    │       ├─ [Job 3] Build & Smoke Test
    │       ├─ [Job 4] Docker Build & Push (DockerHub)
    │       └─ [Job 5] Deploy to Staging (SSH + docker-compose)
    │
    └─► Staging Server
            │
            ├─ Nginx (port 80) → Reverse Proxy
            └─ TaskFlow API (port 3000)
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Language | Node.js 20 (LTS) |
| Framework | Express 4.x |
| Testing | Jest + Supertest |
| Linting | ESLint |
| Build Tool | npm |
| CI/CD | GitHub Actions |
| Containerization | Docker (multi-stage) |
| Orchestration | Docker Compose |
| Proxy | Nginx |
| Registry | Docker Hub |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/tasks` | Get all tasks (filter: `?status=` `?priority=`) |
| GET | `/api/tasks/:id` | Get task by ID |
| POST | `/api/tasks` | Create new task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| PATCH | `/api/tasks/:id/status` | Quick status update |

**Task Schema:**
```json
{
  "id": "uuid-v4",
  "title": "string (required)",
  "description": "string",
  "priority": "low | medium | high",
  "status": "pending | in-progress | completed",
  "dueDate": "ISO date or null",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

---

## Quick Start

### 1. Clone & Run Locally
```bash
git clone https://github.com/<your-username>/taskflow-api.git
cd taskflow-api
npm install
npm start
# API available at http://localhost:3000
```

### 2. Run Tests
```bash
npm test                # run all tests with coverage
```

### 3. Run with Docker
```bash
# Build image
docker build -t taskflow-api .

# Run container
docker run -d -p 3000:3000 --name taskflow taskflow-api

# Verify
curl http://localhost:3000/health
```

### 4. Run Staging with Docker Compose
```bash
docker-compose up -d
# API at http://localhost/api/tasks
# Health at http://localhost/health

docker-compose ps        # check status
docker-compose logs -f   # tail logs
docker-compose down      # stop
```

---

## Project Structure

```
taskflow-api/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # GitHub Actions pipeline
├── src/
│   ├── app.js                 # Express application entry point
│   ├── models/
│   │   └── task.js            # Task model (in-memory store)
│   └── routes/
│       └── tasks.js           # REST route handlers
├── tests/
│   └── tasks.test.js          # Jest test suite (30+ tests)
├── docs/
│   └── pipeline-architecture.md
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml         # Staging environment
├── nginx.conf                 # Reverse proxy config
├── package.json               # npm config & scripts
├── .eslintrc.json             # Lint rules
├── .gitignore
├── .dockerignore
└── README.md
```

---

## CI/CD Pipeline

The GitHub Actions pipeline (`.github/workflows/ci-cd.yml`) runs on every push and PR:

```
Push to main/develop
       │
       ▼
[Lint] ──fail──► ✗ PR blocked
       │
       ▼ pass
[Test] node 18 ─┐
[Test] node 20 ─┴─ fail ──► ✗ PR blocked
       │
       ▼ pass
[Build & Smoke Test]
       │
       ▼ pass (main branch only)
[Docker Build & Push → DockerHub]
       │
       ▼
[Deploy to Staging via SSH]
       │
       ▼
✅ Staging updated
```

### GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_TOKEN` | Docker Hub access token |
| `STAGING_HOST` | Staging server IP/hostname |
| `STAGING_USER` | SSH username |
| `STAGING_SSH_KEY` | Private SSH key |

---

## Git Branching Strategy

```
main          ← production-ready; protected branch
  │
  └── develop ← integration branch
        │
        ├── feature/add-task-filtering
        ├── feature/pagination
        └── fix/validation-error-messages
```

- All features developed on `feature/*` branches
- PRs merged into `develop`, then `develop` → `main`
- Every merge triggers the full CI/CD pipeline

---

## Sample API Calls

```bash
# Create a task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Submit project","priority":"high","dueDate":"2025-05-01"}'

# List all high-priority tasks
curl http://localhost:3000/api/tasks?priority=high

# Mark task as completed
curl -X PATCH http://localhost:3000/api/tasks/<id>/status \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'

# Delete a task
curl -X DELETE http://localhost:3000/api/tasks/<id>
```

---

## License

MIT © 2025
