import { Controller, Get } from '@nestjs/common';
import { HealthResponse } from '@commerce/types';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'commerce-api',
      timestamp: new Date().toISOString(),
    };
  }
}
