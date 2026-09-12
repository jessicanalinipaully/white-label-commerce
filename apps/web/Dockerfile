# Multi-Stage Dockerfile for Next.js Web Frontend

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace files
COPY package.json pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Build Next.js application
RUN pnpm --filter @commerce/types build || true
RUN pnpm --filter @commerce/web build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy Next.js standalone output and public assets
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
USER node

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
