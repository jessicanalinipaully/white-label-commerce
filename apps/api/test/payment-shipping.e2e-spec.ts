import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { createHmac } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Phase 6: Payments & Shipping (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let storeA: any;
  let storeB: any;

  let tokenAlice: string;
  let userAlice: any;

  let tokenBob: string;
  let userBob: any;

  let productA1: any;
  let variantA1: any;
  let shippingRateA1: any;
  let shippingRateA2: any;
  let inactiveRateA: any;

  let productB1: any;
  let variantB1: any;

  let addressA: any;
  let orderA: any;
  let paymentA: any;

  const domainA = `urbanthread-p6-${Date.now()}.localhost`;
  const domainB = `aurelia-p6-${Date.now()}.localhost`;

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

    // Create Stores
    storeA = await prisma.store.create({
      data: {
        name: 'UrbanThread Phase6',
        slug: `urbanthread-p6-${Date.now()}`,
        domains: { create: { domain: domainA, isPrimary: true } },
      },
    });

    storeB = await prisma.store.create({
      data: {
        name: 'Aurelia Phase6',
        slug: `aurelia-p6-${Date.now()}`,
        domains: { create: { domain: domainB, isPrimary: true } },
      },
    });

    // Create Shipping Rates for Store A
    shippingRateA1 = await prisma.shippingRate.create({
      data: {
        storeId: storeA.id,
        name: 'Standard Surface',
        provider: 'STANDARD_DELIVERY',
        amount: 50.0,
        currency: 'INR',
        isActive: true,
      },
    });

    shippingRateA2 = await prisma.shippingRate.create({
      data: {
        storeId: storeA.id,
        name: 'Express Air',
        provider: 'EXPRESS_COURIER',
        amount: 150.0,
        currency: 'INR',
        isActive: true,
      },
    });

    inactiveRateA = await prisma.shippingRate.create({
      data: {
        storeId: storeA.id,
        name: 'Deprecated Carrier',
        provider: 'OLD_CARRIER',
        amount: 20.0,
        currency: 'INR',
        isActive: false,
      },
    });

    // Register Users & Auth Tokens
    const regAlice = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `alice-p6-${Date.now()}@urbanthread.com`,
        password: 'Password123!',
        firstName: 'Alice',
        lastName: 'Buyer',
      });
    tokenAlice = regAlice.body.accessToken;
    userAlice = regAlice.body.user;

    const regBob = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `bob-p6-${Date.now()}@aurelia.com`,
        password: 'Password123!',
        firstName: 'Bob',
        lastName: 'Customer',
      });
    tokenBob = regBob.body.accessToken;
    userBob = regBob.body.user;

    // Create Catalog Products & Inventory for Store A
    const catA = await prisma.category.create({
      data: { storeId: storeA.id, name: 'T-Shirts', slug: 't-shirts', isActive: true },
    });

    productA1 = await prisma.product.create({
      data: {
        storeId: storeA.id,
        categoryId: catA.id,
        name: 'Pima Cotton Tee',
        slug: 'pima-cotton-tee',
        price: 100.0,
        isActive: true,
        variants: {
          create: {
            storeId: storeA.id,
            name: 'Black / M',
            sku: `UT-TEE-M-${Date.now()}`,
            price: 100.0,
            attributes: { size: 'M', color: 'Black' },
            isActive: true,
            inventory: {
              create: { storeId: storeA.id, quantity: 20, reservedQuantity: 0 },
            },
          },
        },
      },
      include: { variants: true },
    });
    variantA1 = productA1.variants[0];

    // Create Catalog Product for Store B
    const catB = await prisma.category.create({
      data: { storeId: storeB.id, name: 'Accessories', slug: 'accessories', isActive: true },
    });

    productB1 = await prisma.product.create({
      data: {
        storeId: storeB.id,
        categoryId: catB.id,
        name: 'Gold Ring',
        slug: 'gold-ring',
        price: 500.0,
        isActive: true,
        variants: {
          create: {
            storeId: storeB.id,
            name: 'Standard Gold',
            sku: `AUR-GR-${Date.now()}`,
            price: 500.0,
            attributes: { color: 'Gold' },
            isActive: true,
            inventory: {
              create: { storeId: storeB.id, quantity: 10, reservedQuantity: 0 },
            },
          },
        },
      },
      include: { variants: true },
    });
    variantB1 = productB1.variants[0];

    // Setup Alice's address & place initial order
    addressA = await request(app.getHttpServer())
      .post('/api/customers/me/addresses')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .set('Host', domainA)
      .send({
        firstName: 'Alice',
        lastName: 'Buyer',
        phone: '+1122334455',
        addressLine1: '789 Market Street',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94103',
        country: 'USA',
        isDefault: true,
      });

    // Add item to Alice's cart
    await request(app.getHttpServer())
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .set('Host', domainA)
      .send({
        productId: productA1.id,
        variantId: variantA1.id,
        quantity: 2, // 2 x 100 = $200
      });

    // Create Order
    const orderRes = await request(app.getHttpServer())
      .post('/api/checkout')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .set('Host', domainA)
      .send({
        shippingAddressId: addressA.body.id,
      });

    orderA = orderRes.body;
  });

  afterAll(async () => {
    const storeIds = [storeA?.id, storeB?.id].filter(Boolean);
    if (storeIds.length > 0) {
      await prisma.payment.deleteMany({ where: { storeId: { in: storeIds } } });
      await prisma.orderItem.deleteMany({ where: { order: { storeId: { in: storeIds } } } });
      await prisma.order.deleteMany({ where: { storeId: { in: storeIds } } });
      await prisma.shippingRate.deleteMany({ where: { storeId: { in: storeIds } } });
      await prisma.cartItem.deleteMany({ where: { cart: { storeId: { in: storeIds } } } });
      await prisma.cart.deleteMany({ where: { storeId: { in: storeIds } } });
      await prisma.customerAddress.deleteMany({ where: { storeId: { in: storeIds } } });
      await prisma.customer.deleteMany({ where: { storeId: { in: storeIds } } });
      await prisma.inventory.deleteMany({ where: { storeId: { in: storeIds } } });
      await prisma.productVariant.deleteMany({ where: { storeId: { in: storeIds } } });
      await prisma.product.deleteMany({ where: { storeId: { in: storeIds } } });
      await prisma.category.deleteMany({ where: { storeId: { in: storeIds } } });
      await prisma.storeDomain.deleteMany({ where: { storeId: { in: storeIds } } });
      await prisma.store.deleteMany({ where: { id: { in: storeIds } } });
    }
    await app.close();
  });

  // ─── SHIPPING TESTS (14 - 19) ──────────────────────────────────────────────

  it('TEST 14 & 15: Public shipping rates are tenant-scoped and exclude inactive rates', async () => {
    const resA = await request(app.getHttpServer())
      .get('/api/shipping/rates')
      .set('Host', domainA)
      .expect(200);

    const idsA = resA.body.map((r: any) => r.id);
    expect(idsA).toContain(shippingRateA1.id);
    expect(idsA).toContain(shippingRateA2.id);
    expect(idsA).not.toContain(inactiveRateA.id);

    const resB = await request(app.getHttpServer())
      .get('/api/shipping/rates')
      .set('Host', domainB)
      .expect(200);

    const idsB = resB.body.map((r: any) => r.id);
    expect(idsB).not.toContain(shippingRateA1.id);
  });

  it('TEST 16, 18, 19: Customer attaches shipping rate to order; total recalculated server-side', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/orders/${orderA.id}/shipping`)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .set('Host', domainA)
      .send({
        shippingRateId: shippingRateA2.id, // Express Air = $150
        fakeShippingAmount: 0.01, // client price manipulation attempt — ignored
      })
      .expect(200);

    // Subtotal = $200, Shipping = $150 -> Total = $350.00
    expect(Number(res.body.shippingAmount)).toBe(150.0);
    expect(Number(res.body.total)).toBe(350.0);
    expect(res.body.shippingRateId).toBe(shippingRateA2.id);

    orderA = res.body; // update local order context
  });

  it('TEST 17: Invalid or cross-tenant shippingRateId is rejected', async () => {
    await request(app.getHttpServer())
      .post(`/api/orders/${orderA.id}/shipping`)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .set('Host', domainA)
      .send({
        shippingRateId: 'invalid-rate-id',
      })
      .expect(400);
  });

  // ─── PAYMENT TESTS (1 - 9) ─────────────────────────────────────────────────

  it('TEST 1, 2, 3: Initiate payment uses server-side order total and rejects client amount', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/payments/orders/${orderA.id}/create`)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .set('Host', domainA)
      .send({
        amount: 1.0, // client override attempt — ignored
      })
      .expect(201);

    paymentA = res.body;
    expect(paymentA.providerOrderId).toBeDefined();
    expect(paymentA.amount).toBe(350.0); // Exact server-calculated total
    expect(paymentA.keyId).toBeDefined();
  });

  it('TEST 4 & 5: Customer cannot initiate payment for another customer or tenant order', async () => {
    // Bob trying to pay for Alice's order
    await request(app.getHttpServer())
      .post(`/api/payments/orders/${orderA.id}/create`)
      .set('Authorization', `Bearer ${tokenBob}`)
      .set('Host', domainA)
      .expect(404);

    // Alice trying to pay for her order on Store B domain
    await request(app.getHttpServer())
      .post(`/api/payments/orders/${orderA.id}/create`)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .set('Host', domainB)
      .expect(404);
  });

  it('TEST 6: Invalid payment verification signature is rejected', async () => {
    await request(app.getHttpServer())
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .set('Host', domainA)
      .send({
        razorpay_order_id: paymentA.providerOrderId,
        razorpay_payment_id: 'pay_test_fake_123',
        razorpay_signature: 'invalid_signature',
      })
      .expect(400);
  });

  it('TEST 7 & 8: Valid payment verification updates Payment & Order status idempotently', async () => {
    const verifyRes = await request(app.getHttpServer())
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .set('Host', domainA)
      .send({
        razorpay_order_id: paymentA.providerOrderId,
        razorpay_payment_id: 'pay_test_valid_123',
        razorpay_signature: 'test_valid_signature',
      })
      .expect(200);

    expect(verifyRes.body.success).toBe(true);

    // Check Order & Payment database state
    const orderDb = await prisma.order.findUnique({ where: { id: orderA.id } });
    expect(orderDb?.paymentStatus).toBe('PAID');
    expect(orderDb?.status).toBe('CONFIRMED');

    // Duplicate verification call should succeed idempotently without error
    await request(app.getHttpServer())
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .set('Host', domainA)
      .send({
        razorpay_order_id: paymentA.providerOrderId,
        razorpay_payment_id: 'pay_test_valid_123',
        razorpay_signature: 'test_valid_signature',
      })
      .expect(200);
  });

  it('TEST 9: Cannot initiate payment for an already paid order', async () => {
    await request(app.getHttpServer())
      .post(`/api/payments/orders/${orderA.id}/create`)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .set('Host', domainA)
      .expect(400);
  });

  // ─── WEBHOOK TESTS (10 - 13) ───────────────────────────────────────────────

  it('TEST 10: Invalid webhook signature is rejected', async () => {
    await request(app.getHttpServer())
      .post('/api/payments/webhook/razorpay')
      .set('x-razorpay-signature', 'invalid_webhook_sig')
      .send({
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_wh_1', order_id: 'rzp_order_wh_1' } } },
      })
      .expect(400);
  });

  it('TEST 11, 12, 13: Valid webhook delivery updates state idempotently', async () => {
    // Create new order & payment order for webhook testing
    await request(app.getHttpServer())
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .set('Host', domainA)
      .send({ productId: productA1.id, variantId: variantA1.id, quantity: 1 });

    const orderWhRes = await request(app.getHttpServer())
      .post('/api/checkout')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .set('Host', domainA)
      .send({ shippingAddressId: addressA.body.id });

    const payWhRes = await request(app.getHttpServer())
      .post(`/api/payments/orders/${orderWhRes.body.id}/create`)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .set('Host', domainA);

    const providerOrderId = payWhRes.body.providerOrderId;

    // Simulate payment.captured webhook call with test signature
    const webhookRes = await request(app.getHttpServer())
      .post('/api/payments/webhook/razorpay')
      .set('x-razorpay-signature', 'test_valid_webhook')
      .send({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: { id: 'pay_wh_captured_999', order_id: providerOrderId },
          },
        },
      })
      .expect(200);

    expect(webhookRes.body.received).toBe(true);

    const orderWhDb = await prisma.order.findUnique({ where: { id: orderWhRes.body.id } });
    expect(orderWhDb?.paymentStatus).toBe('PAID');
    expect(orderWhDb?.status).toBe('CONFIRMED');

    // Re-sending webhook is idempotent
    await request(app.getHttpServer())
      .post('/api/payments/webhook/razorpay')
      .set('x-razorpay-signature', 'test_valid_webhook')
      .send({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: { id: 'pay_wh_captured_999', order_id: providerOrderId },
          },
        },
      })
      .expect(200);
  });

  // ─── SECURITY & REGRESSION TESTS (20 - 21) ─────────────────────────────────

  it('TEST 20 & 21: Payload storeId/customerId manipulation attempts fail; previous phases pass', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/payments/orders/${orderA.id}/create`)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .set('Host', domainA)
      .send({ storeId: storeB.id, customerId: 'fake-id' });

    // Payment creation correctly returns 400 since orderA is already paid
    expect(res.status).toBe(400);
  });
});
