# syntax=docker/dockerfile:1
# Gujarat Police CCTV & AI Intelligence Platform (Sentinel Grid)
# Production Container for Google Cloud Run (Debian glibc for onnxruntime-node compatibility)

FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Compile frontend and backend
RUN npm run build

# Production runtime stage
FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install runtime utilities (curl for healthcheck and ca-certificates for outbound TLS)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src ./src

# Create evidence and storage directories
RUN mkdir -p /app/storage/evidence /app/storage/snapshots

# Expose standard container port
EXPOSE 3000

# Health check against Sentinel Liveness probe
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/system/liveness || exit 1

# Start compiled CommonJS server
CMD ["node", "dist/server.cjs"]
