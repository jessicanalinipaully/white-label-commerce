import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Product Filtering System (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let store1: any;
  let store2: any;

  let categoryApparel: any;
  let categoryFootwear: any;
  let categoryStore2: any;

  let product1: any; // Apparel, size M, color Black, price 1000, compareAt 1500 (33% off), in stock
  let product2: any; // Apparel, size L, color White, price 500, compareAt null, in stock
  let product3: any; // Footwear, size 10, color Black, price 2500, compareAt 3000 (16.6% off), out of stock
  let productStore2: any; // Store 2 product

  const domain1 = `filter-store1-${Date.now()}.localhost`;
  const domain2 = `filter-store2-${Date.now()}.localhost`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    prisma = app.get(PrismaService);

    // 1. Setup Stores
    store1 = await prisma.store.create({
      data: {
        name: 'Filter Test Store 1',
        slug: `filter-store1-${Date.now()}`,
        domains: { create: { domain: domain1, isPrimary: true } },
      },
    });

    store2 = await prisma.store.create({
      data: {
        name: 'Filter Test Store 2',
        slug: `filter-store2-${Date.now()}`,
        domains: { create: { domain: domain2, isPrimary: true } },
      },
    });

    // 2. Setup Categories
    categoryApparel = await prisma.category.create({
      data: {
        storeId: store1.id,
        name: 'Apparel',
        slug: 'apparel',
        isActive: true,
      },
    });

    categoryFootwear = await prisma.category.create({
      data: {
        storeId: store1.id,
        name: 'Footwear',
        slug: 'footwear',
        isActive: true,
      },
    });

    categoryStore2 = await prisma.category.create({
      data: {
        storeId: store2.id,
        name: 'Store 2 Category',
        slug: 'store2-category',
        isActive: true,
      },
    });

    // 3. Setup Products & Variants for Store 1
    // Product 1: Hoodie (Apparel, Price 1000, CompareAt 1500 => 33% discount)
    product1 = await prisma.product.create({
      data: {
        storeId: store1.id,
        categoryId: categoryApparel.id,
        name: 'Oversized Cotton Hoodie',
        slug: 'oversized-cotton-hoodie',
        price: 1000,
        compareAtPrice: 1500,
        isActive: true,
        variants: {
          create: [
            {
              storeId: store1.id,
              name: 'Medium / Black',
              sku: `HOOD-M-BLK-${Date.now()}`,
              price: 1000,
              attributes: { size: 'M', color: 'Black' },
              isActive: true,
              inventory: { create: { storeId: store1.id, quantity: 10, reservedQuantity: 0 } },
            },
          ],
        },
      },
    });

    // Product 2: Basic Tee (Apparel, Price 500, No compareAt price => 0% discount)
    product2 = await prisma.product.create({
      data: {
        storeId: store1.id,
        categoryId: categoryApparel.id,
        name: 'Basic Crewneck Tee',
        slug: 'basic-crewneck-tee',
        price: 500,
        compareAtPrice: null,
        isActive: true,
        variants: {
          create: [
            {
              storeId: store1.id,
              name: 'Large / White',
              sku: `TEE-L-WHT-${Date.now()}`,
              price: 500,
              attributes: { size: 'L', color: 'White' },
              isActive: true,
              inventory: { create: { storeId: store1.id, quantity: 5, reservedQuantity: 0 } },
            },
          ],
        },
      },
    });

    // Product 3: Leather Boots (Footwear, Price 2500, CompareAt 3000 => 16.6% discount, OUT OF STOCK)
    product3 = await prisma.product.create({
      data: {
        storeId: store1.id,
        categoryId: categoryFootwear.id,
        name: 'Leather Combat Boots',
        slug: 'leather-combat-boots',
        price: 2500,
        compareAtPrice: 3000,
        isActive: true,
        variants: {
          create: [
            {
              storeId: store1.id,
              name: 'Size 10 / Black',
              sku: `BOOT-10-BLK-${Date.now()}`,
              price: 2500,
              attributes: { size: '10', color: 'Black' },
              isActive: true,
              inventory: { create: { storeId: store1.id, quantity: 0, reservedQuantity: 0 } },
            },
          ],
        },
      },
    });

    // 4. Setup Product for Store 2 (Tenant Isolation check)
    productStore2 = await prisma.product.create({
      data: {
        storeId: store2.id,
        categoryId: categoryStore2.id,
        name: 'Store 2 Exclusive Item',
        slug: 'store-2-exclusive',
        price: 9999,
        isActive: true,
        variants: {
          create: [
            {
              storeId: store2.id,
              name: 'Store 2 Variant',
              sku: `ST2-VAR-${Date.now()}`,
              price: 9999,
              attributes: { size: 'M', color: 'Red' },
              isActive: true,
              inventory: { create: { storeId: store2.id, quantity: 20, reservedQuantity: 0 } },
            },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    if (store1) {
      await prisma.product.deleteMany({ where: { storeId: store1.id } });
      await prisma.category.deleteMany({ where: { storeId: store1.id } });
      await prisma.store.delete({ where: { id: store1.id } });
    }
    if (store2) {
      await prisma.product.deleteMany({ where: { storeId: store2.id } });
      await prisma.category.deleteMany({ where: { storeId: store2.id } });
      await prisma.store.delete({ where: { id: store2.id } });
    }
    await app.close();
  });

  describe('1. Category Filtering', () => {
    it('should filter products by category ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/storefront/products?categoryId=${categoryApparel.id}`)
        .set('Host', domain1)
        .expect(200);

      expect(res.body.total).toBe(2);
      const ids = res.body.data.map((p: any) => p.id);
      expect(ids).toContain(product1.id);
      expect(ids).toContain(product2.id);
      expect(ids).not.toContain(product3.id);
    });

    it('should filter products by category slug', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/storefront/products?categoryId=footwear')
        .set('Host', domain1)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data[0].id).toBe(product3.id);
    });
  });

  describe('2. Price Filtering', () => {
    it('should filter products by minPrice and maxPrice', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/storefront/products?minPrice=600&maxPrice=1500')
        .set('Host', domain1)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data[0].id).toBe(product1.id);
    });

    it('should handle numeric validation for price boundaries', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/storefront/products?minPrice=abc&maxPrice=600')
        .set('Host', domain1)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data[0].id).toBe(product2.id);
    });
  });

  describe('3. Size / Variant Attribute Filtering', () => {
    it('should filter products by size attribute', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/storefront/products?size=M')
        .set('Host', domain1)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data[0].id).toBe(product1.id);
    });
  });

  describe('4. Color Filtering', () => {
    it('should filter products by color attribute', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/storefront/products?color=White')
        .set('Host', domain1)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data[0].id).toBe(product2.id);
    });
  });

  describe('5. Availability Filtering', () => {
    it('should return only in-stock products when inStock=true', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/storefront/products?inStock=true')
        .set('Host', domain1)
        .expect(200);

      expect(res.body.total).toBe(2);
      const ids = res.body.data.map((p: any) => p.id);
      expect(ids).toContain(product1.id);
      expect(ids).toContain(product2.id);
      expect(ids).not.toContain(product3.id);
    });
  });

  describe('6. Discount Filtering', () => {
    it('should filter products with 20%+ discount', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/storefront/products?discount=20')
        .set('Host', domain1)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data[0].id).toBe(product1.id);
    });
  });

  describe('7. Combined Search & Filters', () => {
    it('should combine q search with category and price filters', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/storefront/products?q=Cotton&categoryId=${categoryApparel.id}&minPrice=800`)
        .set('Host', domain1)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data[0].id).toBe(product1.id);
    });
  });

  describe('8. Sorting Combinations', () => {
    it('should sort products by price ascending and descending', async () => {
      const resAsc = await request(app.getHttpServer())
        .get('/api/storefront/products?sortBy=price_asc')
        .set('Host', domain1)
        .expect(200);

      expect(resAsc.body.data[0].id).toBe(product2.id);

      const resDesc = await request(app.getHttpServer())
        .get('/api/storefront/products?sortBy=price_desc')
        .set('Host', domain1)
        .expect(200);

      expect(resDesc.body.data[0].id).toBe(product3.id);
    });
  });

  describe('9. Pagination & Filter Metadata Options', () => {
    it('should return paginated results and filterOptions aggregated for store', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/storefront/products?page=1&limit=2')
        .set('Host', domain1)
        .expect(200);

      expect(res.body.total).toBe(3);
      expect(res.body.limit).toBe(2);
      expect(res.body.totalPages).toBe(2);

      const opts = res.body.filterOptions;
      expect(opts).toBeDefined();
      expect(opts.availableSizes).toContain('M');
      expect(opts.availableSizes).toContain('L');
      expect(opts.availableColors).toContain('Black');
      expect(opts.availableColors).toContain('White');
      expect(opts.priceBounds.min).toBe(500);
      expect(opts.priceBounds.max).toBe(2500);
    });
  });

  describe('10. Empty Results & Invalid Params', () => {
    it('should return empty array and 0 total when no products match', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/storefront/products?minPrice=99999')
        .set('Host', domain1)
        .expect(200);

      expect(res.body.total).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it('should handle invalid category parameter without crashing', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/storefront/products?categoryId=non-existent-cat-id')
        .set('Host', domain1)
        .expect(200);

      expect(res.body.total).toBe(0);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('11. Strict Tenant Isolation', () => {
    it('should never expose products or categories from Store 2 when requesting Store 1', async () => {
      const res1 = await request(app.getHttpServer())
        .get('/api/storefront/products')
        .set('Host', domain1)
        .expect(200);

      const ids1 = res1.body.data.map((p: any) => p.id);
      expect(ids1).not.toContain(productStore2.id);

      const res2 = await request(app.getHttpServer())
        .get(`/api/storefront/products?categoryId=${categoryStore2.id}`)
        .set('Host', domain1)
        .expect(200);

      expect(res2.body.total).toBe(0);
      expect(res2.body.data).toEqual([]);

      const opts1 = res1.body.filterOptions;
      const catIds1 = opts1.categories.map((c: any) => c.id);
      expect(catIds1).not.toContain(categoryStore2.id);
    });
  });
});
