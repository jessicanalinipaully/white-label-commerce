import { Controller, Get, NotFoundException, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { StorefrontService } from './storefront.service';

function parseNumberParam(val?: any): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}

@Controller('storefront')
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  private resolveStoreId(req: Request): string {
    if (!req.tenant?.store?.id) {
      throw new NotFoundException('Store not found for requested domain');
    }
    return req.tenant.store.id;
  }

  @Get('config')
  getConfig(@Req() req: Request): Promise<any> {
    const storeId = this.resolveStoreId(req);
    return this.storefrontService.getStorefrontConfig(storeId);
  }

  @Get('store')
  getStore(@Req() req: Request): Promise<any> {
    const storeId = this.resolveStoreId(req);
    return this.storefrontService.getStoreInfo(storeId);
  }

  @Get('categories')
  getCategories(@Req() req: Request): Promise<any[]> {
    const storeId = this.resolveStoreId(req);
    return this.storefrontService.getCategories(storeId);
  }

  @Get('products')
  getProducts(
    @Req() req: Request,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('minPrice') minPrice?: any,
    @Query('maxPrice') maxPrice?: any,
    @Query('size') size?: string,
    @Query('color') color?: string,
    @Query('inStock') inStock?: string,
    @Query('discount') discount?: any,
    @Query('sortBy') sortBy?: string,
  ): Promise<any> {
    const storeId = this.resolveStoreId(req);
    return this.storefrontService.getProducts(storeId, {
      page: parseNumberParam(page),
      limit: parseNumberParam(limit),
      q,
      categoryId,
      minPrice: parseNumberParam(minPrice),
      maxPrice: parseNumberParam(maxPrice),
      size,
      color,
      inStock: inStock === 'true' || inStock === '1',
      discount: parseNumberParam(discount),
      sortBy,
    });
  }

  @Get('products/:slug')
  getProduct(@Req() req: Request, @Param('slug') slug: string): Promise<any> {
    const storeId = this.resolveStoreId(req);
    return this.storefrontService.getProductBySlug(storeId, slug);
  }

  @Get('category/:slug')
  getCategoryProducts(
    @Req() req: Request,
    @Param('slug') slug: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('q') q?: string,
    @Query('minPrice') minPrice?: any,
    @Query('maxPrice') maxPrice?: any,
    @Query('size') size?: string,
    @Query('color') color?: string,
    @Query('inStock') inStock?: string,
    @Query('discount') discount?: any,
    @Query('sortBy') sortBy?: string,
  ): Promise<any> {
    const storeId = this.resolveStoreId(req);
    return this.storefrontService.getCategoryWithProducts(storeId, slug, {
      page: parseNumberParam(page),
      limit: parseNumberParam(limit),
      q,
      minPrice: parseNumberParam(minPrice),
      maxPrice: parseNumberParam(maxPrice),
      size,
      color,
      inStock: inStock === 'true' || inStock === '1',
      discount: parseNumberParam(discount),
      sortBy,
    });
  }
}
