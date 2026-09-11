import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

/**
 * Phase 3: Catalog & Inventory Tenant Isolation E2E Tests
 *
 * Verifies that:
 * - UrbanThread can never access Aurelia's catalog/inventory and vice-versa.
 * - IDs cannot be used to cross tenant boundaries.
 * - Business rules (negative inventory, reserved > quantity) are enforced.
 * - Tenant context is always derived from the Host header, never from request body.
 */
describe('Catalog & Inventory Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let aliceToken: string; // UrbanThread OWNER
  let bobToken: string;   // Aurelia OWNER

  // IDs resolved after auth/seed lookup
  let urbanThreadCategoryId: string;
  let aureliaCategoryId: string;
  let urbanThreadProductId: string;
  let aureliaProductId: string;
  let urbanThreadVariantId: string;
  let aureliaVariantId: string;

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

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Authenticate Alice (UrbanThread OWNER)
    const aliceRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'alice@urbanthread.com', password: 'Password123!' });
    aliceToken = aliceRes.body.accessToken;
    expect(aliceToken).toBeDefined();

    // Authenticate Bob (Aurelia OWNER)
    const bobRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'bob@aurelia.com', password: 'Password123!' });
    bobToken = bobRes.body.accessToken;
    expect(bobToken).toBeDefined();

    // Resolve seed IDs from the database directly
    const urbanThread = await prisma.store.findUnique({ where: { slug: 'urbanthread' } });
    const aurelia = await prisma.store.findUnique({ where: { slug: 'aurelia' } });

    expect(urbanThread).toBeTruthy();
    expect(aurelia).toBeTruthy();

    const utCategory = await prisma.category.findFirst({ where: { storeId: urbanThread!.id } });
    const aCategory = await prisma.category.findFirst({ where: { storeId: aurelia!.id } });
    urbanThreadCategoryId = utCategory!.id;
    aureliaCategoryId = aCategory!.id;

    const utProduct = await prisma.product.findFirst({ where: { storeId: urbanThread!.id } });
    const aProduct = await prisma.product.findFirst({ where: { storeId: aurelia!.id } });
    urbanThreadProductId = utProduct!.id;
    aureliaProductId = aProduct!.id;

    const utVariant = await prisma.productVariant.findFirst({ where: { storeId: urbanThread!.id } });
    const aVariant = await prisma.productVariant.findFirst({ where: { storeId: aurelia!.id } });
    urbanThreadVariantId = utVariant!.id;
    aureliaVariantId = aVariant!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // TEST 1: Alice on urbanthread.localhost can list UrbanThread categories
  it('TEST 1: Alice on urbanthread.localhost can list UrbanThread categories', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/categories')
      .set('Host', 'urbanthread.localhost')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const store = await prisma.store.findUnique({ where: { slug: 'urbanthread' } });
    for (const cat of res.body.data) {
      expect(cat.storeId).toBe(store!.id);
    }
  });

  // TEST 2: Bob on aurelia.localhost can list Aurelia categories
  it('TEST 2: Bob on aurelia.localhost can list Aurelia categories', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/categories')
      .set('Host', 'aurelia.localhost')
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const store = await prisma.store.findUnique({ where: { slug: 'aurelia' } });
    for (const cat of res.body.data) {
      expect(cat.storeId).toBe(store!.id);
    }
  });

  // TEST 3: Alice can create an UrbanThread product
  it('TEST 3: Alice can create an UrbanThread product and it auto-associates with UrbanThread', async () => {
    const store = await prisma.store.findUnique({ where: { slug: 'urbanthread' } });

    const res = await request(app.getHttpServer())
      .post('/api/products')
      .set('Host', 'urbanthread.localhost')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ name: 'Test Product Phase3', slug: 'test-product-phase3', price: 19.99 })
      .expect(201);

    expect(res.body.storeId).toBe(store!.id);
    expect(res.body.name).toBe('Test Product Phase3');

    await prisma.product.delete({ where: { id: res.body.id } });
  });

  // TEST 4: Alice cannot access an Aurelia product by ID
  it('TEST 4: Alice on urbanthread.localhost cannot access an Aurelia product by ID', async () => {
    await request(app.getHttpServer())
      .get(`/api/products/${aureliaProductId}`)
      .set('Host', 'urbanthread.localhost')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect((res) => {
        expect([403, 404]).toContain(res.status);
      });
  });

  // TEST 5: Alice cannot modify Aurelia inventory
  it('TEST 5: Alice on urbanthread.localhost cannot modify Aurelia inventory', async () => {
    await request(app.getHttpServer())
      .patch(`/api/inventory/${aureliaVariantId}`)
      .set('Host', 'urbanthread.localhost')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ quantity: 999 })
      .expect((res) => {
        expect([403, 404]).toContain(res.status);
      });
  });

  // TEST 6: Bob cannot modify UrbanThread inventory
  it('TEST 6: Bob on aurelia.localhost cannot modify UrbanThread inventory', async () => {
    await request(app.getHttpServer())
      .patch(`/api/inventory/${urbanThreadVariantId}`)
      .set('Host', 'aurelia.localhost')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ quantity: 999 })
      .expect((res) => {
        expect([403, 404]).toContain(res.status);
      });
  });

  // TEST 7: Manipulating product/category IDs cannot cross tenant boundaries
  it('TEST 7a: Alice cannot fetch an Aurelia category by ID via UrbanThread host', async () => {
    await request(app.getHttpServer())
      .get(`/api/categories/${aureliaCategoryId}`)
      .set('Host', 'urbanthread.localhost')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect((res) => {
        expect([403, 404]).toContain(res.status);
      });
  });

  it('TEST 7b: Bob cannot fetch an UrbanThread product by ID via Aurelia host', async () => {
    await request(app.getHttpServer())
      .get(`/api/products/${urbanThreadProductId}`)
      .set('Host', 'aurelia.localhost')
      .set('Authorization', `Bearer ${bobToken}`)
      .expect((res) => {
        expect([403, 404]).toContain(res.status);
      });
  });

  it('TEST 7c: Alice cannot delete an Aurelia category via UrbanThread host', async () => {
    await request(app.getHttpServer())
      .delete(`/api/categories/${aureliaCategoryId}`)
      .set('Host', 'urbanthread.localhost')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect((res) => {
        expect([403, 404]).toContain(res.status);
      });
  });

  // TEST 8: Creating a product auto-associates with the resolved tenant (not from body)
  it('TEST 8: Creating a product automatically associates with the resolved tenant not from body', async () => {
    const aurelia = await prisma.store.findUnique({ where: { slug: 'aurelia' } });

    const res = await request(app.getHttpServer())
      .post('/api/products')
      .set('Host', 'aurelia.localhost')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ name: 'Tenant Auto Product', slug: 'tenant-auto-product', price: 25.00 })
      .expect(201);

    expect(res.body.storeId).toBe(aurelia!.id);
    expect(res.body.name).toBe('Tenant Auto Product');

    await prisma.product.delete({ where: { id: res.body.id } });
  });

  // TEST 9: Duplicate slug within same store is rejected
  it('TEST 9: Creating a category with a duplicate slug in the SAME store is rejected 409', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Host', 'urbanthread.localhost')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ name: 'Duplicate Test', slug: 'duplicate-slug-test' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/categories')
      .set('Host', 'urbanthread.localhost')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ name: 'Duplicate Test 2', slug: 'duplicate-slug-test' })
      .expect(409);

    await prisma.category.delete({ where: { id: createRes.body.id } });
  });

  // TEST 10: Same slug in DIFFERENT stores is allowed
  it('TEST 10: Same category slug in a different store is allowed 201', async () => {
    const slug = 'cross-store-slug-test';

    const utRes = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Host', 'urbanthread.localhost')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ name: 'Cross Store UT', slug })
      .expect(201);

    const aRes = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Host', 'aurelia.localhost')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ name: 'Cross Store A', slug })
      .expect(201);

    await prisma.category.delete({ where: { id: utRes.body.id } });
    await prisma.category.delete({ where: { id: aRes.body.id } });
  });

  // TEST 11: Inventory decrease below zero is rejected
  it('TEST 11: Inventory decrease below zero is rejected 400', async () => {
    const inventory = await prisma.inventory.findUnique({
      where: { variantId: urbanThreadVariantId },
    });
    expect(inventory).toBeTruthy();

    const excessiveAmount = inventory!.quantity + 9999;

    await request(app.getHttpServer())
      .post(`/api/inventory/${urbanThreadVariantId}/decrease`)
      .set('Host', 'urbanthread.localhost')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ amount: excessiveAmount })
      .expect(400);
  });

  // TEST 12: reservedQuantity greater than quantity is rejected
  it('TEST 12: Setting reservedQuantity greater than quantity is rejected 400', async () => {
    // Set known baseline
    await request(app.getHttpServer())
      .patch(`/api/inventory/${urbanThreadVariantId}`)
      .set('Host', 'urbanthread.localhost')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ quantity: 10, reservedQuantity: 0 })
      .expect(200);

    // Attempt reserved > quantity
    await request(app.getHttpServer())
      .patch(`/api/inventory/${urbanThreadVariantId}`)
      .set('Host', 'urbanthread.localhost')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ quantity: 10, reservedQuantity: 11 })
      .expect(400);
  });

  // BONUS: Alice can increase her own inventory
  it('BONUS: Alice can increase UrbanThread inventory', async () => {
    const before = await prisma.inventory.findUnique({
      where: { variantId: urbanThreadVariantId },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/inventory/${urbanThreadVariantId}/increase`)
      .set('Host', 'urbanthread.localhost')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ amount: 5 })
      .expect(200);

    expect(res.body.quantity).toBe(before!.quantity + 5);
  });

  // BONUS: Cross-tenant variant access blocked
  it('BONUS: Alice cannot access Aurelia product variants via UrbanThread host', async () => {
    await request(app.getHttpServer())
      .get(`/api/products/${aureliaProductId}/variants`)
      .set('Host', 'urbanthread.localhost')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect((res) => {
        expect([403, 404]).toContain(res.status);
      });
  });

  // BONUS: Pagination
  it('BONUS: Pagination - GET /api/products returns paginated result', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/products?page=1&limit=2')
      .set('Host', 'urbanthread.localhost')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
    expect(res.body.total).toBeDefined();
    expect(res.body.totalPages).toBeDefined();
    expect(res.body.data.length).toBeLessThanOrEqual(2);
  });
});
