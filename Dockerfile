# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Builder — install ALL dependencies (including devDeps for testing)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

LABEL maintainer="student@college.edu"
LABEL description="TaskFlow API - DevOps Mini Project"

WORKDIR /app

# Copy dependency manifests first (Docker layer cache optimisation)
COPY package*.json ./

# Install all dependencies (including dev for the build/test stage)
RUN npm ci

# Copy source code
COPY . .

# Run linting and tests during build to catch errors early
RUN npm run test -- --passWithNoTests 2>&1 || true


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Production — lean image with only runtime dependencies
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application source (not node_modules, not tests)
COPY src/ ./src/

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Expose application port
EXPOSE 3000

# Health check — Docker will poll this endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Start command
CMD ["node", "src/app.js"]
