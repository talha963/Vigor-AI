# ---------------------------------------------------------------------------
# Vigor Web - Production Dockerfile
#
# STORAGE OPTIMIZED: Reuses the already-installed ${BASE_IMAGE} (Node 24)
# so ZERO new base image bytes are downloaded to your disk.
# ---------------------------------------------------------------------------

ARG BASE_IMAGE=n8nio/n8n:latest

# --- Stage 1: Dependencies & Build -----------------------------------------
FROM ${BASE_IMAGE} AS builder
USER root
WORKDIR /app

# Ensure devDependencies are installed even if base image sets NODE_ENV=production
ENV NODE_ENV=development

# Copy package manifests
COPY apps/web/package*.json ./

# Install all dependencies (including typescript and types)
RUN npm install --include=dev

# Copy application source code
COPY apps/web ./

# Build Next.js in standalone mode
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# --- Stage 2: Minimal Standalone Runner ------------------------------------
FROM ${BASE_IMAGE} AS runner
USER node
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone distribution (minimal traced files)
COPY --chown=node:node --from=builder /app/.next/standalone ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static
COPY --chown=node:node --from=builder /app/public ./public

EXPOSE 3000

# Replace the base image's n8n entrypoint with Node
ENTRYPOINT ["node", "server.js"]
