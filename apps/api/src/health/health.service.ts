import { Injectable, ServiceUnavailableException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async checkHealth(): Promise<any> {
    let dbHealthy = false;
    let redisHealthy = false;

    // 1. Check PostgreSQL
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbHealthy = true;
    } catch (err: any) {
      this.logger.error('PostgreSQL health check failed', err?.message);
    }

    // 2. Check Redis
    try {
      const pingRes = await this.redis.getClient().ping();
      redisHealthy = pingRes === 'PONG';
    } catch (err: any) {
      this.logger.error('Redis health check failed', err?.message);
    }

    const isHealthy = dbHealthy && redisHealthy;
    const response = {
      status: isHealthy ? 'ok' : 'degraded',
      service: 'commerce-api',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealthy ? 'up' : 'down',
        redis: redisHealthy ? 'up' : 'down',
      },
    };

    if (!isHealthy) {
      throw new ServiceUnavailableException(response);
    }

    return response;
  }
}
