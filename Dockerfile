# Multi-stage production build for Juba News Full-Stack System
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* bun.lock* ./
RUN npm install

# Copy source code
COPY . .

# Build Vite frontend and compile Express server to dist/server.cjs
RUN npm run build

# Production runner image
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package.json ./
RUN npm install --omit=dev

# Copy compiled artifacts from builder
COPY --from=builder /app/dist ./dist

# Non-root user for cybersecurity hardening
USER node

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/server.cjs"]
