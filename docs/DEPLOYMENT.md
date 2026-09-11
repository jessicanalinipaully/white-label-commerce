# White-Label Commerce Platform — VPS Deployment Guide

This guide documents the dedicated single-tenant VPS deployment process for the White-Label E-Commerce Platform.

---

## 1. Production Architecture Overview

Each client store operates on an isolated VPS environment running a production Docker stack:

```
Internet (Port 80/443)
       │
  Nginx Reverse Proxy
       ├── /api/  →  NestJS API Container (127.0.0.1:4000)
       └── /      →  Next.js Web Container (127.0.0.1:3000)
                         │                 │
                         └── Internal Docker Network (commerce_network)
                                   ├── PostgreSQL Container (5432)
                                   └── Redis Container (6379)
```

- **Reusability**: All client deployments use the exact same master repository code.
- **Tenant Isolation**: Each client VPS runs dedicated PostgreSQL, Redis, API, Web, and persistent volumes.
- **Security**: PostgreSQL and Redis are bound exclusively to the internal Docker bridge network and are never exposed to the public Internet.

---

## 2. VPS System Requirements & Dependencies

### Minimum Server Specifications:
- **OS**: Ubuntu 22.04 LTS / Debian 12 (recommended)
- **CPU**: 2 vCPUs
- **RAM**: 4 GB (minimum)
- **Disk**: 20 GB SSD

### Required Software Prerequisites:
```bash
# 1. Install Docker & Docker Compose
sudo apt update && sudo apt install -y docker.io docker-compose-v2 curl git nginx certbot python3-certbot-nginx

# 2. Start and enable Docker
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

---

## 3. Deployment Setup & Environment Secrets

### Step 1: Clone Repository
```bash
git clone <your-repository-url> /opt/white-label-commerce
cd /opt/white-label-commerce
```

### Step 2: Configure Production Environment Variables
Copy `.env.production.example` to `.env.production`:
```bash
cp .env.production.example .env.production
nano .env.production
```

Fill in secure production values for:
- `DATABASE_URL=postgresql://commerce_user:<SECURE_PASSWORD>@postgres:5432/commerce_prod?schema=public`
- `JWT_SECRET=<MIN_32_CHAR_RANDOM_SECRET>`
- `WEB_URL=https://shop.clientdomain.com`
- `NEXT_PUBLIC_API_URL=https://shop.clientdomain.com/api`
- `CORS_ORIGIN=https://shop.clientdomain.com`
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`

*Note: Never commit `.env.production` to Git.*

---

## 4. Production Stack Deployment

Run the automated production deployment script:

```bash
./scripts/deploy-production.sh
```

### What `deploy-production.sh` Executes:
1. Validates `.env.production` configuration.
2. Boots `postgres` and `redis` containers.
3. Waits for PostgreSQL database readiness.
4. Executes non-destructive Prisma migrations (`prisma migrate deploy`).
5. Builds and launches production `api` and `web` containers.
6. Verifies `/api/health` status.

---

## 5. Nginx Reverse Proxy Setup

Copy the project Nginx configuration to `/etc/nginx/`:

```bash
sudo cp infrastructure/nginx/nginx.conf /etc/nginx/nginx.conf
sudo cp infrastructure/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
sudo nginx -t
sudo systemctl reload nginx
```

### Critical Tenant Header Forwarding
The platform resolves tenants based on incoming domain host headers. Nginx must preserve these headers:
```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

---

## 6. HTTPS / SSL Setup (Let's Encrypt Certbot)

### Step 1: Point DNS A Record
Ensure client domain DNS `shop.clientdomain.com` points to the VPS public IP address.

### Step 2: Obtain SSL Certificate via Certbot
```bash
sudo certbot --nginx -d shop.clientdomain.com
```

### Step 3: Verify Auto-Renewal
Certbot automatically configures systemd timers. Test renewal:
```bash
sudo certbot renew --dry-run
```

---

## 7. Tenant Store & Domain Mapping

Log into the Admin Console or database to configure the client's store domain:
1. Ensure `Store` record exists.
2. Ensure `StoreDomain` record contains `domain: "shop.clientdomain.com"`.
3. The platform will automatically map incoming HTTP requests on `shop.clientdomain.com` to that store.

---

## 8. Database Backups & Restore

### Executing a Backup:
```bash
./scripts/backup-database.sh
```
Timestamped compressed backups are stored in `backups/commerce_backup_YYYYMMDD_HHMMSS.sql.gz`.

### Restoring a Backup:
```bash
gunzip -c backups/commerce_backup_YYYYMMDD_HHMMSS.sql.gz | docker exec -i commerce_prod_postgres psql -U commerce_user -d commerce_prod
```

---

## 9. Updating an Existing Deployment

To update a live VPS deployment safely:
```bash
cd /opt/white-label-commerce
git pull origin main
./scripts/deploy-production.sh
```

---

## 10. Health Check & Troubleshooting

- **Check Health Status**:
  ```bash
  curl http://127.0.0.1:4000/api/health
  ```
- **View Container Logs**:
  ```bash
  docker compose -f docker-compose.production.yml logs -f --tail=100
  ```
- **Restart Container Stack**:
  ```bash
  docker compose -f docker-compose.production.yml restart
  ```
