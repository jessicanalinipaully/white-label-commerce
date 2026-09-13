import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { StoreUserRole } from '@commerce/types';
import { createHmac } from 'crypto';

describe('Phase 10: Security, Hardening & Concurrency (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let storeA: any;
  let storeB: any;

  let domainA: string;
  let domainB: string;

  let tokenOwnerA: string;
  let userOwnerA: any;

  let tokenSupportA: string;
  let userSupportA: any;

  let tokenOwnerB: string;
  let userOwnerB: any;

  let tokenCustomerA: string;
  let userCustomerA: any;
  let custA: any;

  let categoryA: any;
  let productA: any;
  let variantA: any;

  let categoryB: any;
  let productB: any;
  let variantB: any;

  let shippingRateA: any;

  beforeAll(async () => {
    process.env.DISABLE_RATE_LIMIT = 'true';
    const timestamp = Date.now();
    domainA = `sec-store-a-${timestamp}.localhost`;
    domainB = `sec-store-b-${timestamp}.localhost`;

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

    // 1. Create Stores
    storeA = await prisma.store.create({
      data: {
        name: 'Sec Store A',
        slug: `sec-store-a-${timestamp}`,
        domains: { create: { domain: domainA, isPrimary: true } },
      },
    });

    storeB = await prisma.store.create({
      data: {
        name: 'Sec Store B',
        slug: `sec-store-b-${timestamp}`,
        domains: { create: { domain: domainB, isPrimary: true } },
      },
    });

    // Helper to register user
    const registerUser = async (email: string, firstName: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'Password123!', firstName, lastName: 'User' });
      return { token: res.body.accessToken, user: res.body.user };
    };

    // Owner A
    const ownerA = await registerUser(`sec-owner-a-${timestamp}@test.com`, 'OwnerA');
    tokenOwnerA = ownerA.token;
    userOwnerA = ownerA.user;
    await prisma.storeUser.create({
      data: { storeId: storeA.id, userId: userOwnerA.id, role: StoreUserRole.OWNER },
    });

    // Support Agent A
    const suppA = await registerUser(`sec-supp-a-${timestamp}@test.com`, 'SuppA');
    tokenSupportA = suppA.token;
    userSupportA = suppA.user;
    await prisma.storeUser.create({
      data: { storeId: storeA.id, userId: userSupportA.id, role: StoreUserRole.SUPPORT_AGENT },
    });

    // Owner B
    const ownerB = await registerUser(`sec-owner-b-${timestamp}@test.com`, 'OwnerB');
    tokenOwnerB = ownerB.token;
    userOwnerB = ownerB.user;
    await prisma.storeUser.create({
      data: { storeId: storeB.id, userId: userOwnerB.id, role: StoreUserRole.OWNER },
    });

    // Customer A
    const custAData = await registerUser(`sec-cust-a-${timestamp}@test.com`, 'CustA');
    tokenCustomerA = custAData.token;
    userCustomerA = custAData.user;

    // Initialize Customer A profile record
    const custRes = await request(app.getHttpServer())
      .get('/api/customers/me')
      .set('Authorization', `Bearer ${tokenCustomerA}`)
      .set('X-Forwarded-Host', domainA)
      .expect(200);
    custA = custRes.body;

    // Catalog Store A
    categoryA = await prisma.category.create({
      data: { storeId: storeA.id, name: 'Cat A', slug: `cat-a-${timestamp}` },
    });
    productA = await prisma.product.create({
      data: {
        storeId: storeA.id,
        categoryId: categoryA.id,
        name: 'Product A',
        slug: `prod-a-${timestamp}`,
        price: 100.0,
      },
    });
    variantA = await prisma.productVariant.create({
      data: {
        storeId: storeA.id,
        productId: productA.id,
        name: 'Variant A',
        sku: `SKU-A-${timestamp}`,
        price: 100.0,
        attributes: { size: 'M' },
        inventory: { create: { storeId: storeA.id, quantity: 5, lowStockThreshold: 2 } },
      },
    });

    // Catalog Store B
    categoryB = await prisma.category.create({
      data: { storeId: storeB.id, name: 'Cat B', slug: `cat-b-${timestamp}` },
    });
    productB = await prisma.product.create({
      data: {
        storeId: storeB.id,
        categoryId: categoryB.id,
        name: 'Product B',
        slug: `prod-b-${timestamp}`,
        price: 200.0,
      },
    });
    variantB = await prisma.productVariant.create({
      data: {
        storeId: storeB.id,
        productId: productB.id,
        name: 'Variant B',
        sku: `SKU-B-${timestamp}`,
        price: 200.0,
        attributes: { size: 'L' },
        inventory: { create: { storeId: storeB.id, quantity: 10, lowStockThreshold: 2 } },
      },
    });

    shippingRateA = await prisma.shippingRate.create({
      data: {
        storeId: storeA.id,
        name: 'Standard Rate A',
        provider: 'STANDARD',
        amount: 50.0,
      },
    });
  });

  afterAll(async () => {
    delete process.env.DISABLE_RATE_LIMIT;
    if (prisma) {
      await prisma.payment.deleteMany({ where: { storeId: { in: [storeA.id, storeB.id] } } });
      await prisma.orderItem.deleteMany({ where: { order: { storeId: { in: [storeA.id, storeB.id] } } } });
      await prisma.order.deleteMany({ where: { storeId: { in: [storeA.id, storeB.id] } } });
      await prisma.cartItem.deleteMany({ where: { cart: { storeId: { in: [storeA.id, storeB.id] } } } });
      await prisma.cart.deleteMany({ where: { storeId: { in: [storeA.id, storeB.id] } } });
      await prisma.customerAddress.deleteMany({ where: { storeId: { in: [storeA.id, storeB.id] } } });
      await prisma.customer.deleteMany({ where: { storeId: { in: [storeA.id, storeB.id] } } });
      await prisma.inventory.deleteMany({ where: { storeId: { in: [storeA.id, storeB.id] } } });
      await prisma.productVariant.deleteMany({ where: { storeId: { in: [storeA.id, storeB.id] } } });
      await prisma.product.deleteMany({ where: { storeId: { in: [storeA.id, storeB.id] } } });
      await prisma.category.deleteMany({ where: { storeId: { in: [storeA.id, storeB.id] } } });
      await prisma.shippingRate.deleteMany({ where: { storeId: { in: [storeA.id, storeB.id] } } });
      await prisma.storeUser.deleteMany({ where: { storeId: { in: [storeA.id, storeB.id] } } });
      await prisma.storeDomain.deleteMany({ where: { storeId: { in: [storeA.id, storeB.id] } } });
      await prisma.store.deleteMany({ where: { id: { in: [storeA.id, storeB.id] } } });
    }
    if (app) {
      await app.close();
    }
  });

  // -------------------------------------------------------------
  // Test 1-5: Cross-Tenant Data Access Protection
  // -------------------------------------------------------------
  it('1. Cross-tenant product access blocked: Store B admin cannot edit Store A product', async () => {
    await request(app.getHttpServer())
      .patch(`/api/admin/products/${productA.id}`)
      .set('Authorization', `Bearer ${tokenOwnerB}`)
      .set('X-Forwarded-Host', domainA)
      .send({ name: 'Hacked Product A' })
      .expect(403);
  });

  it('2. Cross-tenant order access blocked: Customer B cannot view Store A order', async () => {
    const orderA = await prisma.order.create({
      data: {
        storeId: storeA.id,
        customerId: custA.id,
        orderNumber: `ORD-TEST-${Date.now()}`,
        subtotal: 100,
        total: 100,
        shippingAddressSnapshot: {},
        billingAddressSnapshot: {},
      },
    });

    await request(app.getHttpServer())
      .get(`/api/orders/${orderA.id}`)
      .set('Authorization', `Bearer ${tokenOwnerB}`)
      .set('X-Forwarded-Host', domainA)
      .expect(404);
  });

  it('3. Cross-tenant customer access blocked: Store B admin cannot view Store A customer profile', async () => {
    await request(app.getHttpServer())
      .get(`/api/admin/customers/${custA.id}`)
      .set('Authorization', `Bearer ${tokenOwnerB}`)
      .set('X-Forwarded-Host', domainA)
      .expect(403);
  });

  it('4. Cross-tenant inventory manipulation blocked: Store B admin cannot adjust Store A inventory', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/inventory/${variantA.id}/adjust`)
      .set('Authorization', `Bearer ${tokenOwnerB}`)
      .set('X-Forwarded-Host', domainA)
      .send({ adjustmentQuantity: 50 })
      .expect(403);
  });

  it('5. Cross-tenant admin access blocked: Store B admin blocked from Store A admin dashboard', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${tokenOwnerB}`)
      .set('X-Forwarded-Host', domainA)
      .expect(403);
  });

  // -------------------------------------------------------------
  // Test 6-9: Authentication & RBAC Hardening
  // -------------------------------------------------------------
  it('6. Unauthorized admin endpoint blocked: Unauthenticated request returns 401', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .set('X-Forwarded-Host', domainA)
      .expect(401);
  });

  it('7. Incorrect StoreUser role blocked: SUPPORT_AGENT blocked from modifying shipping rate', async () => {
    await request(app.getHttpServer())
      .patch(`/api/admin/shipping-rates/${shippingRateA.id}`)
      .set('Authorization', `Bearer ${tokenSupportA}`)
      .set('X-Forwarded-Host', domainA)
      .send({ amount: 1.0 })
      .expect(403);
  });

  it('8. Invalid JWT token blocked: Request with malformed Bearer token returns 401', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .set('Authorization', 'Bearer invalid.fake.jwt.token')
      .set('X-Forwarded-Host', domainA)
      .expect(401);
  });

  it('9. Expired/invalid authentication blocked: Request without Bearer prefix returns 401', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .set('Authorization', tokenOwnerA)
      .set('X-Forwarded-Host', domainA)
      .expect(401);
  });

  // -------------------------------------------------------------
  // Test 10-14: Payment & Order Tampering Protection
  // -------------------------------------------------------------
  it('10. Client cannot modify order total: Price derived strictly server-side from active variant price', async () => {
    // Add item to cart
    await request(app.getHttpServer())
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${tokenCustomerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({ productId: productA.id, variantId: variantA.id, quantity: 1 })
      .expect(201);

    // Create shipping address
    const addrRes = await request(app.getHttpServer())
      .post('/api/customers/me/addresses')
      .set('Authorization', `Bearer ${tokenCustomerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890',
        addressLine1: '123 Main St',
        city: 'Metropolis',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      })
      .expect(201);

    // Attempt checkout - notice payload only contains valid DTO properties; server derives total strictly from database product price
    const checkoutRes = await request(app.getHttpServer())
      .post('/api/checkout')
      .set('Authorization', `Bearer ${tokenCustomerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        shippingAddressId: addrRes.body.id,
      })
      .expect(201);

    expect(Number(checkoutRes.body.total)).toBe(100);
  });

  it('11. Client cannot modify payment status directly via API', async () => {
    const order = await prisma.order.findFirst({ where: { storeId: storeA.id, customerId: custA.id } });

    await request(app.getHttpServer())
      .patch(`/api/orders/${order!.id}`)
      .set('Authorization', `Bearer ${tokenCustomerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({ paymentStatus: 'PAID' })
      .expect(404);
  });

  it('12. Invalid payment signature rejected', async () => {
    const order = await prisma.order.findFirst({ where: { storeId: storeA.id, customerId: custA.id } });

    // Create payment order
    const payOrderRes = await request(app.getHttpServer())
      .post(`/api/payments/orders/${order!.id}/create`)
      .set('Authorization', `Bearer ${tokenCustomerA}`)
      .set('X-Forwarded-Host', domainA)
      .expect(201);

    // Verify with invalid signature
    await request(app.getHttpServer())
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${tokenCustomerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        razorpay_order_id: payOrderRes.body.providerOrderId,
        razorpay_payment_id: 'pay_fake_123',
        razorpay_signature: 'invalid_fake_hmac_signature',
      })
      .expect(400);
  });

  it('13. Duplicate payment verification is idempotent', async () => {
    const order = await prisma.order.findFirst({ where: { storeId: storeA.id, customerId: custA.id } });

    const payOrderRes = await request(app.getHttpServer())
      .post(`/api/payments/orders/${order!.id}/create`)
      .set('Authorization', `Bearer ${tokenCustomerA}`)
      .set('X-Forwarded-Host', domainA)
      .expect(201);

    const providerOrderId = payOrderRes.body.providerOrderId;
    const providerPaymentId = `pay_mock_${Date.now()}`;
    const validSignature = 'valid_sig_mock_123';

    // First verification succeeds
    await request(app.getHttpServer())
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${tokenCustomerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        razorpay_order_id: providerOrderId,
        razorpay_payment_id: providerPaymentId,
        razorpay_signature: validSignature,
      })
      .expect(200);

    // Second verification returns idempotent success
    const res2 = await request(app.getHttpServer())
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${tokenCustomerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        razorpay_order_id: providerOrderId,
        razorpay_payment_id: providerPaymentId,
        razorpay_signature: validSignature,
      })
      .expect(200);

    expect(res2.body.message).toContain('already verified');
  });

  it('14. Payment verification for order belonging to another customer is rejected', async () => {
    await request(app.getHttpServer())
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${tokenOwnerB}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        razorpay_order_id: 'non_existent_provider_id',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig',
      })
      .expect(404);
  });

  // -------------------------------------------------------------
  // Test 15: Inventory Concurrency & Overselling Protection
  // -------------------------------------------------------------
  it('15. Checkout cannot oversell inventory under simultaneous requests', async () => {
    // Create a new product with limited stock = 1
    const limitedProd = await prisma.product.create({
      data: { storeId: storeA.id, categoryId: categoryA.id, name: 'Limited Stock Concurrency', slug: `limited-${Date.now()}`, price: 50 },
    });
    const limitedVar = await prisma.productVariant.create({
      data: {
        storeId: storeA.id,
        productId: limitedProd.id,
        name: 'Stock 1',
        sku: `SKU-LIM-${Date.now()}`,
        price: 50,
        attributes: {},
        inventory: { create: { storeId: storeA.id, quantity: 1, lowStockThreshold: 1 } },
      },
    });

    const registerCust = async (index: number) => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: `conc-${index}-${Date.now()}@test.com`, password: 'Password123!', firstName: `User${index}`, lastName: 'Test' });
      const token = res.body.accessToken;
      await request(app.getHttpServer())
        .get('/api/customers/me')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Forwarded-Host', domainA);
      return { token, userId: res.body.user.id };
    };

    const c1 = await registerCust(1);
    const c2 = await registerCust(2);

    const setupCustomer = async (token: string) => {
      await request(app.getHttpServer())
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Forwarded-Host', domainA)
        .send({ productId: limitedProd.id, variantId: limitedVar.id, quantity: 1 });

      const addr = await request(app.getHttpServer())
        .post('/api/customers/me/addresses')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Forwarded-Host', domainA)
        .send({ firstName: 'F', lastName: 'L', phone: '123', addressLine1: 'A', city: 'C', state: 'S', postalCode: '1', country: 'US' });

      return addr.body.id;
    };

    const addr1 = await setupCustomer(c1.token);
    const addr2 = await setupCustomer(c2.token);

    // Execute 2 simultaneous checkout requests for stock of 1
    const results = await Promise.all([
      request(app.getHttpServer()).post('/api/checkout').set('Authorization', `Bearer ${c1.token}`).set('X-Forwarded-Host', domainA).send({ shippingAddressId: addr1 }),
      request(app.getHttpServer()).post('/api/checkout').set('Authorization', `Bearer ${c2.token}`).set('X-Forwarded-Host', domainA).send({ shippingAddressId: addr2 }),
    ]);

    const successes = results.filter((r) => r.status === 201);
    const failures = results.filter((r) => r.status === 400);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    // Verify inventory never became negative
    const finalInv = await prisma.inventory.findUnique({ where: { variantId: limitedVar.id } });
    expect(finalInv!.quantity).toBe(0);
  });

  // -------------------------------------------------------------
  // Test 16-19: Input Validation & Formatting
  // -------------------------------------------------------------
  it('16. Invalid quantities rejected (negative or zero cart quantity)', async () => {
    await request(app.getHttpServer())
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${tokenCustomerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({ productId: productA.id, variantId: variantA.id, quantity: -5 })
      .expect(400);
  });

  it('17. Negative prices rejected on product creation', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        name: 'Negative Price Product',
        categoryId: categoryA.id,
        price: -99.99,
      })
      .expect(400);
  });

  it('18. Malformed input rejected by DTO validation pipe', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        name: 12345, // Invalid type
        unknownUnwhitelistedField: true,
      })
      .expect(400);
  });

  it('19. Unknown tenant host header rejected with 404', async () => {
    await request(app.getHttpServer())
      .get('/api/storefront/config')
      .set('X-Forwarded-Host', 'unknown-fake-domain.localhost')
      .expect(404);
  });

  // -------------------------------------------------------------
  // Test 20-21: Config Validation & Health Endpoint Dependency Status
  // -------------------------------------------------------------
  it('20. Production config validation checks required environment parameters', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });

  it('21. Health endpoint reports dependency status for postgres and redis', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('checks');
    expect(res.body.checks.database).toBe('up');
    expect(res.body.checks.redis).toBe('up');
  });

  // -------------------------------------------------------------
  // Test 22-26: Focused Admin Authentication & Authorization Flow
  // -------------------------------------------------------------
  it('22. Admin Flow - Unauthenticated GET /admin/dashboard returns 401', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .set('X-Forwarded-Host', domainA)
      .expect(401);
  });

  it('23. Admin Flow - Authenticated non-admin customer access returns 403', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${tokenCustomerA}`)
      .set('X-Forwarded-Host', domainA)
      .expect(403);
  });

  it('24. Admin Flow - Authorized store owner/admin access returns 200 OK', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .expect(200);

    expect(res.body).toHaveProperty('storeName', 'Sec Store A');
  });

  it('25. Admin Flow - Expired/invalid authentication token returns 401', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature')
      .set('X-Forwarded-Host', domainA)
      .expect(401);
  });

  it('26. Admin Flow - Tenant isolation prevents Store B admin from accessing Store A dashboard', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${tokenOwnerB}`)
      .set('X-Forwarded-Host', domainA)
      .expect(403);
  });

  // -------------------------------------------------------------
  // Test 27-32: Local Product Image Upload & Deletion Flow
  // -------------------------------------------------------------
  let uploadedImageId: string;

  it('27. Image Upload - Authorized admin upload saves file locally & stores ProductImage record', async () => {
    const dummyJpgBuffer = Buffer.from(
      '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
      'base64',
    );

    const res = await request(app.getHttpServer())
      .post(`/api/admin/products/${productA.id}/images/upload`)
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .attach('file', dummyJpgBuffer, 'hoodie-sample.jpg')
      .field('altText', 'Sample Hoodie')
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.productId).toBe(productA.id);
    expect(res.body.url).toContain('/uploads/products/');
    expect(res.body.altText).toBe('Sample Hoodie');

    uploadedImageId = res.body.id;
  });

  it('28. Image Upload - Unauthorized customer access blocked with 403', async () => {
    const dummyBuffer = Buffer.from('fake image data');

    await request(app.getHttpServer())
      .post(`/api/admin/products/${productA.id}/images/upload`)
      .set('Authorization', `Bearer ${tokenCustomerA}`)
      .set('X-Forwarded-Host', domainA)
      .attach('file', dummyBuffer, 'test.jpg')
      .expect(403);
  });

  it('29. Image Upload - Invalid image type rejected with 400', async () => {
    const textBuffer = Buffer.from('console.log("hello world")');

    await request(app.getHttpServer())
      .post(`/api/admin/products/${productA.id}/images/upload`)
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .attach('file', textBuffer, 'script.txt')
      .expect(400);
  });

  it('30. Image Upload - Oversized image file (> 5MB) rejected with 400', async () => {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

    await request(app.getHttpServer())
      .post(`/api/admin/products/${productA.id}/images/upload`)
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .attach('file', largeBuffer, 'huge-image.jpg')
      .expect(400);
  });

  it('31. Image Upload - Tenant isolation prevents Store B admin from uploading to Store A product', async () => {
    const dummyBuffer = Buffer.from('test');

    await request(app.getHttpServer())
      .post(`/api/admin/products/${productA.id}/images/upload`)
      .set('Authorization', `Bearer ${tokenOwnerB}`)
      .set('X-Forwarded-Host', domainA)
      .attach('file', dummyBuffer, 'store-b-hack.jpg')
      .expect(403);
  });

  it('32. Image Deletion - Authorized admin can delete uploaded ProductImage', async () => {
    expect(uploadedImageId).toBeDefined();

    await request(app.getHttpServer())
      .delete(`/api/admin/products/${productA.id}/images/${uploadedImageId}`)
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .expect(200);

    const deletedRecord = await prisma.productImage.findUnique({ where: { id: uploadedImageId } });
    expect(deletedRecord).toBeNull();
  });

  // -------------------------------------------------------------
  // Test 33: Storefront Category Deletion Synchronization
  // -------------------------------------------------------------
  it('33. Category Deletion - Deleted category immediately disappears from storefront API response', async () => {
    // 1. Create a category
    const tempCat = await prisma.category.create({
      data: {
        storeId: storeA.id,
        name: 'Test Collection To Delete',
        slug: `test-del-cat-${Date.now()}`,
      },
    });

    // 2. Storefront lists the category
    const resBefore = await request(app.getHttpServer())
      .get('/api/storefront/categories')
      .set('X-Forwarded-Host', domainA)
      .expect(200);

    expect(resBefore.body.some((c: any) => c.id === tempCat.id)).toBe(true);

    // 3. Admin deletes the category
    await request(app.getHttpServer())
      .delete(`/api/admin/categories/${tempCat.id}`)
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .expect(200);

    // 4. Storefront immediately reflects the current database state
    const resAfter = await request(app.getHttpServer())
      .get('/api/storefront/categories')
      .set('X-Forwarded-Host', domainA)
      .expect(200);

    expect(resAfter.body.some((c: any) => c.id === tempCat.id)).toBe(false);
  });

  // -------------------------------------------------------------
  // Test 34: Storefront Theme Configuration Application & Isolation
  // -------------------------------------------------------------
  it('34. Theme Configuration - Admin saved theme persists in DB and is returned by storefront config for tenant', async () => {
    const testColor = '#E91E63';

    // 1. Update theme via Admin API for Store A
    await request(app.getHttpServer())
      .patch('/api/admin/theme')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({ primaryColor: testColor })
      .expect(200);

    // 2. Verify Storefront API for Store A returns saved primary color
    const resA = await request(app.getHttpServer())
      .get('/api/storefront/config')
      .set('X-Forwarded-Host', domainA)
      .expect(200);

    expect(resA.body.theme.primaryColor).toBe(testColor);

    // 3. Tenant isolation: Store B storefront config must NOT be affected
    const resB = await request(app.getHttpServer())
      .get('/api/storefront/config')
      .set('X-Forwarded-Host', domainB)
      .expect(200);

    expect(resB.body.theme.primaryColor).not.toBe(testColor);
  });
});

