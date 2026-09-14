import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Customer Wishlist System (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const domainA = 'urbanthread.localhost';
  const domainB = 'aurelia.localhost';

  let tokenAlice: string;
  let tokenBob: string;
  let tokenAurelia: string;

  let productA1Id: string;
  let productA2Id: string;
  let productA3Id: string;
  let productB1Id: string;

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

    // Login Alice on Store A (urbanthread)
    const loginAlice = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('X-Forwarded-Host', domainA)
      .send({ email: 'alice@urbanthread.com', password: 'Password123!' });
    tokenAlice = loginAlice.body.accessToken;

    // Register / Login Bob on Store A
    const emailBob = 'bob.urban@urbanthread.com';
    const existingUserBob = await prisma.user.findUnique({ where: { email: emailBob } });
    if (!existingUserBob) {
      const regRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .set('X-Forwarded-Host', domainA)
        .send({
          name: 'Bob Urban',
          email: emailBob,
          password: 'Password123!',
        });
      tokenBob = regRes.body.accessToken;
    } else {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('X-Forwarded-Host', domainA)
        .send({ email: emailBob, password: 'Password123!' });
      tokenBob = loginRes.body.accessToken;
    }

    // Register / Login customer on Store B (aurelia)
    const emailB = 'customer.b@aurelia.com';
    const existingUserB = await prisma.user.findUnique({ where: { email: emailB } });
    if (!existingUserB) {
      const regRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .set('X-Forwarded-Host', domainB)
        .send({
          name: 'Aurelia Customer',
          email: emailB,
          password: 'Password123!',
        });
      tokenAurelia = regRes.body.accessToken;
    } else {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('X-Forwarded-Host', domainB)
        .send({ email: emailB, password: 'Password123!' });
      tokenAurelia = loginRes.body.accessToken;
    }

    // Get Store A products
    const storeA = await prisma.store.findUnique({ where: { slug: 'urbanthread' } });
    const productsA = await prisma.product.findMany({
      where: { storeId: storeA!.id, isActive: true },
      take: 3,
    });
    productA1Id = productsA[0].id;
    productA2Id = productsA[1].id;
    productA3Id = productsA[2].id;

    // Get Store B products
    const storeB = await prisma.store.findUnique({ where: { slug: 'aurelia' } });
    const productsB = await prisma.product.findMany({
      where: { storeId: storeB!.id, isActive: true },
      take: 1,
    });
    productB1Id = productsB[0].id;

    // Clean wishlists for test accounts
    const aliceCust = await prisma.customer.findFirst({ where: { storeId: storeA!.id, user: { email: 'alice@urbanthread.com' } } });
    if (aliceCust) {
      await prisma.wishlist.deleteMany({ where: { storeId: storeA!.id, customerId: aliceCust.id } });
    }
    const bobCust = await prisma.customer.findFirst({ where: { storeId: storeA!.id, user: { email: 'bob@urbanthread.com' } } });
    if (bobCust) {
      await prisma.wishlist.deleteMany({ where: { storeId: storeA!.id, customerId: bobCust.id } });
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. GET /api/customer/wishlist returns an empty wishlist initially', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customer/wishlist')
      .set('X-Forwarded-Host', domainA)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .expect(200);

    expect(res.body.items).toBeDefined();
    expect(res.body.items.length).toBe(0);
    expect(res.body.totalItems).toBe(0);
  });

  it('2. POST /api/customer/wishlist/:productId adds product to wishlist', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/customer/wishlist/${productA1Id}`)
      .set('X-Forwarded-Host', domainA)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .expect(201);

    expect(res.body.totalItems).toBe(1);
    expect(res.body.items[0].productId).toBe(productA1Id);
    expect(res.body.items[0].productName).toBeDefined();
    expect(res.body.items[0].price).toBeGreaterThan(0);
  });

  it('3. Duplicate wishlist entries are prevented by unique constraint', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/customer/wishlist/${productA1Id}`)
      .set('X-Forwarded-Host', domainA)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .expect(201);

    expect(res.body.totalItems).toBe(1);
    expect(res.body.items.length).toBe(1);
  });

  it('4. Customer Bob in same store has an isolated empty wishlist', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customer/wishlist')
      .set('X-Forwarded-Host', domainA)
      .set('Authorization', `Bearer ${tokenBob}`)
      .expect(200);

    expect(res.body.totalItems).toBe(0);
  });

  it('5. Cross-tenant validation: Cannot add Store B product into Store A wishlist', async () => {
    await request(app.getHttpServer())
      .post(`/api/customer/wishlist/${productB1Id}`)
      .set('X-Forwarded-Host', domainA)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .expect(404);
  });

  it('6. Tenant Isolation: Store B customer cannot access Store A wishlist items', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customer/wishlist')
      .set('X-Forwarded-Host', domainB)
      .set('Authorization', `Bearer ${tokenAurelia}`)
      .expect(200);

    expect(res.body.totalItems).toBe(0);
  });

  it('7. POST /api/customer/wishlist/merge merges guest product IDs without duplicates', async () => {
    // Current Alice wishlist: [productA1Id]
    // Merge guest list: [productA1Id, productA2Id, productA3Id, "invalid-id-123"]
    const res = await request(app.getHttpServer())
      .post('/api/customer/wishlist/merge')
      .set('X-Forwarded-Host', domainA)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ productIds: [productA1Id, productA2Id, productA3Id, 'invalid-id-123', productB1Id] })
      .expect(200);

    expect(res.body.totalItems).toBe(3);
    const itemProductIds = res.body.items.map((i: any) => i.productId);
    expect(itemProductIds).toContain(productA1Id);
    expect(itemProductIds).toContain(productA2Id);
    expect(itemProductIds).toContain(productA3Id);
    expect(itemProductIds).not.toContain(productB1Id);
    expect(itemProductIds).not.toContain('invalid-id-123');
  });

  it('8. POST /api/customer/wishlist/:productId/move-to-cart moves item from wishlist to cart', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/customer/wishlist/${productA1Id}/move-to-cart`)
      .set('X-Forwarded-Host', domainA)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .expect(200);

    // Wishlist should now have 2 items (productA2Id, productA3Id)
    expect(res.body.totalItems).toBe(2);
    const itemProductIds = res.body.items.map((i: any) => i.productId);
    expect(itemProductIds).not.toContain(productA1Id);

    // Verify item is now in cart
    const cartRes = await request(app.getHttpServer())
      .get('/api/cart')
      .set('X-Forwarded-Host', domainA)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .expect(200);

    const cartProductIds = cartRes.body.items.map((i: any) => i.productId);
    expect(cartProductIds).toContain(productA1Id);
  });

  it('9. DELETE /api/customer/wishlist/:productId removes single product from wishlist', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/customer/wishlist/${productA2Id}`)
      .set('X-Forwarded-Host', domainA)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .expect(200);

    expect(res.body.totalItems).toBe(1);
    expect(res.body.items[0].productId).toBe(productA3Id);
  });

  it('10. DELETE /api/customer/wishlist clears all items from wishlist', async () => {
    const res = await request(app.getHttpServer())
      .delete('/api/customer/wishlist')
      .set('X-Forwarded-Host', domainA)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .expect(200);

    expect(res.body.totalItems).toBe(0);
    expect(res.body.items.length).toBe(0);
  });
});
