# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:24.15.0-alpine AS builder

WORKDIR /app

# Copy workspace manifests for dependency caching
COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN npm ci

# Copy source
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/

# Build shared then api
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/api

# ─── Stage 2: Runner ─────────────────────────────────────────────────────────
FROM node:24.15.0-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Only production deps
COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN npm ci --omit=dev

# Copy built output
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

RUN mkdir -p /app/uploads

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]
