import { Injectable, NestMiddleware, NotFoundException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { StoreService } from '../store/store.service';
import { TenantContext } from '@commerce/types';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(private readonly storeService: StoreService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Extract hostname strictly from host/forwarded-host headers (NEVER query params or body)
    const hostHeader = (req.headers['x-forwarded-host'] || req.headers['host'] || '') as string;
    const rawHostname = hostHeader.split(',')[0].trim();

    const normalizedDomain = this.storeService.normalizeDomain(rawHostname);

    if (normalizedDomain) {
      // 2. Resolve store by domain
      const result = await this.storeService.findStoreByDomain(normalizedDomain);

      if (result) {
        // 3. Attach authoritative tenant context to request
        req.tenant = {
          store: result.store,
          domain: result.domain,
        };
      }
    }

    next();
  }
}
