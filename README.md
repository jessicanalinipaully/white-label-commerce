# White Label Commerce Platform — Phase 1 Foundation

Production-grade reusable fashion/clothing e-commerce platform monorepo foundation.

## 📁 Repository Structure

```
.
├── apps/
│   ├── api/                 # NestJS Backend Application (Port 4000, prefix /api)
│   └── web/                 # Next.js Frontend Application (Port 3000, App Router)
├── packages/
│   ├── database/            # Prisma client schema & PostgreSQL migrations
│   ├── config/              # Shared TypeScript & ESLint configuration
│   ├── types/               # Shared TypeScript types & interfaces
│   └── validation/          # Shared Zod validation schemas
├── infrastructure/
│   └── docker/              # Docker auxiliary configuration
├── docker-compose.yml       # PostgreSQL 16 & Redis 7 Docker services
├── pnpm-workspace.yaml      # Monorepo workspace definition
├── package.json             # Root workspace package & scripts
├── .env.example             # Environment configuration template
└── README.md                # Quickstart & documentation guide
```

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Node.js**: `>=18.0.0`
- **pnpm**: `>=8.0.0` (or `npx pnpm`)
- **Docker Compose** or **PostgreSQL 16** & **Redis 7** services

---

### 2. Install Dependencies

```bash
pnpm install
```

---

### 3. Start PostgreSQL & Redis Services

Using Docker Compose:
```bash
docker compose up -d
```

Or using system services (PostgreSQL 16 on port 5432 and Redis 7 on port 6379):
```bash
brew services start postgresql@16
brew services start redis
```

Verify status:
- **PostgreSQL**: Port `5432` (`database: commerce`, `user: commerce`, `password: commerce_password`)
- **Redis**: Port `6379`

---

### 4. Run Prisma Database Migrations & Generate Client

```bash
pnpm db:generate
pnpm db:migrate
```

---

### 5. Start Backend Application (NestJS)

```bash
pnpm --filter @commerce/api dev
```
The NestJS API will start at: `http://localhost:4000/api`

---

### 6. Start Frontend Application (Next.js)

```bash
pnpm --filter @commerce/web dev
```
The Next.js web application will start at: `http://localhost:3000`

---

## 🧪 Testing API Endpoints

### 1. Test Health Endpoint (`GET /api/health`)

```bash
curl -X GET http://localhost:4000/api/health
```

Expected Response:
```json
{
  "status": "ok",
  "service": "commerce-api",
  "timestamp": "2026-09-11T01:55:00.000Z"
}
```

---

### 2. Test Registration (`POST /api/auth/register`)

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "firstName": "Jane",
    "lastName": "Doe"
  }'
```

Expected Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cl...",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "USER",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### 3. Test Login (`POST /api/auth/login`)

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

Expected Response:
```json
{
  "accessToken": "<YOUR_ACCESS_TOKEN>",
  "user": {
    "id": "cl...",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "USER",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### 4. Test Protected Profile Endpoint (`GET /api/auth/me`)

**Without JWT Token (Should fail with 401 Unauthorized):**
```bash
curl -i -X GET http://localhost:4000/api/auth/me
```

**With Valid JWT Token:**
```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

Expected Response:
```json
{
  "id": "cl...",
  "email": "user@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "USER",
  "createdAt": "...",
  "updatedAt": "..."
}
```
