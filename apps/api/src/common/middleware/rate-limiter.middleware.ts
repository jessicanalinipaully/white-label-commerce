import { Injectable, NestMiddleware, HttpStatus, Optional } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../../redis/redis.service';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private readonly hits = new Map<string, RateLimitRecord>();

  constructor(@Optional() private readonly redisService?: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip rate limiting during test executions if explicitly disabled
    if (process.env.DISABLE_RATE_LIMIT === 'true') {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const path = req.path;
    const now = Date.now();

    // Determine limit and window based on path
    let limit = 300; // default general limit
    let windowMs = 60 * 1000; // 1 minute window
    let windowSec = 60;

    if (path.includes('/auth/login') || path.includes('/auth/register')) {
      limit = 15;
    } else if (path.includes('/orders/checkout') || path.includes('/payments/verify') || path.includes('/payments/webhook')) {
      limit = 30;
    } else if (path.includes('/admin/')) {
      limit = 150;
    }

    // Attempt Redis-backed rate limiting first
    if (this.redisService) {
      try {
        const client = this.redisService.getClient();
        if (client && client.status === 'ready') {
          const redisKey = `ratelimit:${ip}:${path}`;
          const currentHits = await client.incr(redisKey);
          if (currentHits === 1) {
            await client.expire(redisKey, windowSec);
          }
          if (currentHits > limit) {
            const ttl = await client.ttl(redisKey);
            res.setHeader('Retry-After', ttl > 0 ? ttl : windowSec);
            return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              message: 'Too many requests, please try again later.',
              timestamp: new Date().toISOString(),
            });
          }
          return next();
        }
      } catch {
        // Fallback to in-memory strategy on Redis errors
      }
    }

    // In-memory fallback strategy
    const key = `${ip}:${path}`;

    // Lightweight map cleanup when tracking over 2,000 active keys
    if (this.hits.size > 2000) {
      for (const [k, v] of this.hits.entries()) {
        if (now > v.resetTime) {
          this.hits.delete(k);
        }
      }
    }

    const record = this.hits.get(key);

    if (!record || now > record.resetTime) {
      this.hits.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= limit) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests, please try again later.',
        timestamp: new Date().toISOString(),
      });
    }

    record.count += 1;
    next();
  }
}
