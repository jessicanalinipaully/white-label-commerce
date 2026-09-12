# Multi-Stage Dockerfile for NestJS API

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy root workspace configuration
COPY package.json pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies across workspace
RUN pnpm install --frozen-lockfile || pnpm install

# Generate Prisma Client
RUN pnpm --filter @commerce/database db:generate

# Build workspace dependencies & API
RUN pnpm --filter @commerce/types build || true
RUN pnpm --filter @commerce/api build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy node_modules & built outputs from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
USER node

EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]
