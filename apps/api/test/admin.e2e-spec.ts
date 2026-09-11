import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { OrderPaymentStatus, OrderStatus, StoreUserRole } from '@commerce/types';

describe('Phase 7: Admin Dashboard & Store Management (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let storeA: any;
  let storeB: any;

  let domainA: string;
  let domainB: string;

  // Users for Store A with different roles
  let tokenOwnerA: string;
  let userOwnerA: any;

  let tokenAdminA: string;
  let userAdminA: any;

  let tokenManagerA: string;
  let userManagerA: any;

  let tokenInvManagerA: string;
  let userInvManagerA: any;

  let tokenSupportA: string;
  let userSupportA: any;

  let tokenUserNoRole: string;
  let userNoRole: any;

  // User for Store B
  let tokenOwnerB: string;
  let userOwnerB: any;

  // Test Entities
  let categoryA1: any;
  let categoryB1: any;

  let productA1: any;
  let variantA1: any;
  let inventoryA1: any;

  let productB1: any;
  let variantB1: any;
  let inventoryB1: any;

  let orderA1: any;
  let orderB1: any;

  let customerA1: any;
  let customerB1: any;

  let shippingRateA1: any;
  let shippingRateB1: any;

  beforeAll(async () => {
    const timestamp = Date.now();
    domainA = `admin-store-a-${timestamp}.localhost`;
    domainB = `admin-store-b-${timestamp}.localhost`;

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

    // Create Store A and Store B
    storeA = await prisma.store.create({
      data: {
        name: 'Store A Admin',
        slug: `store-a-admin-${timestamp}`,
        domains: { create: { domain: domainA, isPrimary: true } },
      },
    });

    storeB = await prisma.store.create({
      data: {
        name: 'Store B Admin',
        slug: `store-b-admin-${timestamp}`,
        domains: { create: { domain: domainB, isPrimary: true } },
      },
    });

    // Helper to register user
    const registerUser = async (email: string, firstName: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Password123!',
          firstName,
          lastName: 'User',
        });
      return { token: res.body.accessToken, user: res.body.user };
    };

    // Owner A
    const ownerAData = await registerUser(`owner-a-${timestamp}@test.com`, 'OwnerA');
    tokenOwnerA = ownerAData.token;
    userOwnerA = ownerAData.user;
    await prisma.storeUser.create({
      data: { storeId: storeA.id, userId: userOwnerA.id, role: StoreUserRole.OWNER },
    });

    // Admin A
    const adminAData = await registerUser(`admin-a-${timestamp}@test.com`, 'AdminA');
    tokenAdminA = adminAData.token;
    userAdminA = adminAData.user;
    await prisma.storeUser.create({
      data: { storeId: storeA.id, userId: userAdminA.id, role: StoreUserRole.ADMIN },
    });

    // Manager A
    const mgrAData = await registerUser(`mgr-a-${timestamp}@test.com`, 'ManagerA');
    tokenManagerA = mgrAData.token;
    userManagerA = mgrAData.user;
    await prisma.storeUser.create({
      data: { storeId: storeA.id, userId: userManagerA.id, role: StoreUserRole.MANAGER },
    });

    // Inventory Manager A
    const invAData = await registerUser(`inv-a-${timestamp}@test.com`, 'InvMgrA');
    tokenInvManagerA = invAData.token;
    userInvManagerA = invAData.user;
    await prisma.storeUser.create({
      data: { storeId: storeA.id, userId: userInvManagerA.id, role: StoreUserRole.INVENTORY_MANAGER },
    });

    // Support Agent A
    const suppAData = await registerUser(`supp-a-${timestamp}@test.com`, 'SupportA');
    tokenSupportA = suppAData.token;
    userSupportA = suppAData.user;
    await prisma.storeUser.create({
      data: { storeId: storeA.id, userId: userSupportA.id, role: StoreUserRole.SUPPORT_AGENT },
    });

    // User without StoreUser membership
    const noRoleData = await registerUser(`norole-${timestamp}@test.com`, 'NoRole');
    tokenUserNoRole = noRoleData.token;
    userNoRole = noRoleData.user;

    // Owner B for Store B
    const ownerBData = await registerUser(`owner-b-${timestamp}@test.com`, 'OwnerB');
    tokenOwnerB = ownerBData.token;
    userOwnerB = ownerBData.user;
    await prisma.storeUser.create({
      data: { storeId: storeB.id, userId: userOwnerB.id, role: StoreUserRole.OWNER },
    });

    // Create Categories
    categoryA1 = await prisma.category.create({
      data: { storeId: storeA.id, name: 'Apparel A', slug: `apparel-a-${timestamp}` },
    });

    categoryB1 = await prisma.category.create({
      data: { storeId: storeB.id, name: 'Apparel B', slug: `apparel-b-${timestamp}` },
    });

    // Create Products & Variants
    productA1 = await prisma.product.create({
      data: {
        storeId: storeA.id,
        categoryId: categoryA1.id,
        name: 'Product A1',
        slug: `prod-a1-${timestamp}`,
        sku: `SKU-A1-${timestamp}`,
        price: 999,
        isActive: true,
      },
    });

    variantA1 = await prisma.productVariant.create({
      data: {
        storeId: storeA.id,
        productId: productA1.id,
        name: 'Variant A1 Default',
        sku: `SKU-VAR-A1-${timestamp}`,
        price: 999,
        attributes: {},
        isActive: true,
      },
    });

    inventoryA1 = await prisma.inventory.create({
      data: {
        storeId: storeA.id,
        variantId: variantA1.id,
        quantity: 50,
        reservedQuantity: 0,
        lowStockThreshold: 10,
      },
    });

    productB1 = await prisma.product.create({
      data: {
        storeId: storeB.id,
        categoryId: categoryB1.id,
        name: 'Product B1',
        slug: `prod-b1-${timestamp}`,
        sku: `SKU-B1-${timestamp}`,
        price: 1499,
        isActive: true,
      },
    });

    variantB1 = await prisma.productVariant.create({
      data: {
        storeId: storeB.id,
        productId: productB1.id,
        name: 'Variant B1 Default',
        sku: `SKU-VAR-B1-${timestamp}`,
        price: 1499,
        attributes: {},
        isActive: true,
      },
    });

    inventoryB1 = await prisma.inventory.create({
      data: {
        storeId: storeB.id,
        variantId: variantB1.id,
        quantity: 30,
        reservedQuantity: 0,
        lowStockThreshold: 5,
      },
    });

    // Create Customer & Order for Store A
    customerA1 = await prisma.customer.create({
      data: {
        storeId: storeA.id,
        userId: userOwnerA.id,
        firstName: 'Alice',
        lastName: 'CustomerA',
        phone: '9876543210',
      },
    });

    orderA1 = await prisma.order.create({
      data: {
        storeId: storeA.id,
        customerId: customerA1.id,
        orderNumber: `ORD-A1-${timestamp}`,
        status: OrderStatus.PENDING,
        paymentStatus: OrderPaymentStatus.PAID,
        subtotal: 999,
        shippingAmount: 50,
        total: 1049,
        shippingAddressSnapshot: {},
        billingAddressSnapshot: {},
        items: {
          create: {
            productId: productA1.id,
            variantId: variantA1.id,
            productName: 'Product A1',
            variantName: 'Variant A1 Default',
            sku: variantA1.sku,
            quantity: 1,
            unitPrice: 999,
            lineTotal: 999,
          },
        },
      },
    });

    // Create Customer & Order for Store B
    customerB1 = await prisma.customer.create({
      data: {
        storeId: storeB.id,
        userId: userOwnerB.id,
        firstName: 'Bob',
        lastName: 'CustomerB',
        phone: '9876543211',
      },
    });

    orderB1 = await prisma.order.create({
      data: {
        storeId: storeB.id,
        customerId: customerB1.id,
        orderNumber: `ORD-B1-${timestamp}`,
        status: OrderStatus.PENDING,
        paymentStatus: OrderPaymentStatus.PENDING,
        subtotal: 1499,
        shippingAmount: 0,
        total: 1499,
        shippingAddressSnapshot: {},
        billingAddressSnapshot: {},
        items: {
          create: {
            productId: productB1.id,
            variantId: variantB1.id,
            productName: 'Product B1',
            variantName: 'Variant B1 Default',
            sku: variantB1.sku,
            quantity: 1,
            unitPrice: 1499,
            lineTotal: 1499,
          },
        },
      },
    });

    // Shipping Rates
    shippingRateA1 = await prisma.shippingRate.create({
      data: {
        storeId: storeA.id,
        name: 'Standard Ground A',
        provider: 'FedEx',
        amount: 50,
        currency: 'INR',
        isActive: true,
      },
    });

    shippingRateB1 = await prisma.shippingRate.create({
      data: {
        storeId: storeB.id,
        name: 'Standard Ground B',
        provider: 'DHL',
        amount: 80,
        currency: 'INR',
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  /** AUTHORIZATION & RBAC */
  describe('RBAC & Role-Based Authorization', () => {
    it('1. OWNER can access admin dashboard', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/dashboard')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .expect(200);

      expect(res.body.storeName).toBe('Store A Admin');
      expect(res.body.totalRevenue).toBe(1049);
    });

    it('2. ADMIN can access admin dashboard', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/dashboard')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .expect(200);

      expect(res.body.storeName).toBe('Store A Admin');
    });

    it('3. MANAGER can access products/orders but receives 403 on inventory adjustment or shipping rate creation', async () => {
      // Allowed: Products
      await request(app.getHttpServer())
        .get('/api/admin/products')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenManagerA}`)
        .expect(200);

      // Forbidden: Inventory adjustment
      await request(app.getHttpServer())
        .post(`/api/admin/inventory/${variantA1.id}/adjust`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenManagerA}`)
        .send({ adjustmentQuantity: 10 })
        .expect(403);

      // Forbidden: Shipping Rate Creation
      await request(app.getHttpServer())
        .post('/api/admin/shipping-rates')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenManagerA}`)
        .send({ name: 'Express', provider: 'BlueDart', amount: 100 })
        .expect(403);
    });

    it('4. INVENTORY_MANAGER can access inventory endpoints but receives 403 on orders/customers/dashboard', async () => {
      // Allowed: Inventory List & Adjust
      await request(app.getHttpServer())
        .get('/api/admin/inventory')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenInvManagerA}`)
        .expect(200);

      // Forbidden: Orders
      await request(app.getHttpServer())
        .get('/api/admin/orders')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenInvManagerA}`)
        .expect(403);

      // Forbidden: Customers
      await request(app.getHttpServer())
        .get('/api/admin/customers')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenInvManagerA}`)
        .expect(403);
    });

    it('5. SUPPORT_AGENT can access orders and customers but receives 403 on product creation/inventory adjustment', async () => {
      // Allowed: Orders & Customers
      await request(app.getHttpServer())
        .get('/api/admin/orders')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenSupportA}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/admin/customers')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenSupportA}`)
        .expect(200);

      // Forbidden: Product creation
      await request(app.getHttpServer())
        .post('/api/admin/products')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenSupportA}`)
        .send({ name: 'Illegal Prod', price: 100 })
        .expect(403);
    });

    it('6. Unauthorized user without StoreUser membership receives 403', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/dashboard')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenUserNoRole}`)
        .expect(403);
    });

    it('7. Unauthenticated request without JWT token receives 401', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/dashboard')
        .set('Host', domainA)
        .expect(401);
    });
  });

  /** TENANT ISOLATION */
  describe('Tenant Isolation & Cross-Store Boundary Tests', () => {
    it('8. Admin of Store A cannot access Store B product', async () => {
      await request(app.getHttpServer())
        .get(`/api/admin/products/${productB1.id}`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .expect(404);
    });

    it('9. Admin of Store A cannot access Store B order', async () => {
      await request(app.getHttpServer())
        .get(`/api/admin/orders/${orderB1.id}`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .expect(404);
    });

    it('10. Admin of Store A cannot access Store B customer', async () => {
      await request(app.getHttpServer())
        .get(`/api/admin/customers/${customerB1.id}`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .expect(404);
    });

    it('11. Admin of Store A cannot access Store B inventory', async () => {
      await request(app.getHttpServer())
        .get(`/api/admin/inventory/${variantB1.id}`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .expect(404);
    });

    it('12. Admin of Store A cannot modify Store B shipping rate', async () => {
      await request(app.getHttpServer())
        .patch(`/api/admin/shipping-rates/${shippingRateB1.id}`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({ name: 'Hacked Rate' })
        .expect(404);
    });

    it('13. Client-submitted storeId in payload cannot alter tenant context', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/products')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({
          name: 'Tenant Spoof Product',
          price: 500,
          storeId: storeB.id, // Attempt to spoof store B
        })
        .expect(201);

      expect(res.body.storeId).toBe(storeA.id);
    });
  });

  /** PRODUCTS */
  describe('Product & Category Operations', () => {
    let createdProd: any;

    it('14. Create product with store-scoped slug', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/products')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({
          name: 'Unique Shirt',
          price: 799,
          categoryId: categoryA1.id,
        })
        .expect(201);

      createdProd = res.body;
      expect(createdProd.storeId).toBe(storeA.id);
      expect(createdProd.slug).toBe('unique-shirt');
    });

    it('15. Update product details & price', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/admin/products/${createdProd.id}`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({ price: 899, name: 'Unique Shirt Updated' })
        .expect(200);

      expect(res.body.price).toBe('899');
    });

    it('16. Deactivate product when referenced in historical orders', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/admin/products/${productA1.id}`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .expect(200);

      expect(res.body.isActive).toBe(false);
    });

    it('17. Product slug uniqueness is store-scoped', async () => {
      // Same slug in Store B should succeed
      await request(app.getHttpServer())
        .post('/api/admin/products')
        .set('Host', domainB)
        .set('Authorization', `Bearer ${tokenOwnerB}`)
        .send({
          name: 'Unique Shirt',
          price: 799,
        })
        .expect(201);

      // Same slug again in Store A should fail
      await request(app.getHttpServer())
        .post('/api/admin/products')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({
          name: 'Unique Shirt',
          price: 799,
        })
        .expect(400);
    });

    it('18. Cross-tenant category assignment is rejected', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/products')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({
          name: 'Cross Category Prod',
          price: 500,
          categoryId: categoryB1.id, // Store B category
        })
        .expect(400);
    });
  });

  /** VARIANTS */
  describe('Product Variant Operations', () => {
    let createdVariant: any;

    it('19. Create product variant', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/admin/products/${productA1.id}/variants`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({
          name: 'Size XL',
          sku: `SKU-XL-${Date.now()}`,
          price: 1099,
        })
        .expect(201);

      createdVariant = res.body;
      expect(createdVariant.productId).toBe(productA1.id);
      expect(createdVariant.inventory).toBeDefined();
    });

    it('20. Cross-tenant variant creation is rejected', async () => {
      await request(app.getHttpServer())
        .post(`/api/admin/products/${productB1.id}/variants`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({
          name: 'Illegal Variant',
          sku: `SKU-ILL-${Date.now()}`,
        })
        .expect(404);
    });

    it('21. SKU uniqueness is store-scoped', async () => {
      const skuTest = `SKU-DUPLICATE-${Date.now()}`;

      // Create in Store A
      await request(app.getHttpServer())
        .post(`/api/admin/products/${productA1.id}/variants`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({ name: 'Var SKU 1', sku: skuTest })
        .expect(201);

      // Same SKU in Store A fails
      await request(app.getHttpServer())
        .post(`/api/admin/products/${productA1.id}/variants`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({ name: 'Var SKU 2', sku: skuTest })
        .expect(400);

      // Same SKU in Store B succeeds
      await request(app.getHttpServer())
        .post(`/api/admin/products/${productB1.id}/variants`)
        .set('Host', domainB)
        .set('Authorization', `Bearer ${tokenOwnerB}`)
        .send({ name: 'Var SKU B', sku: skuTest })
        .expect(201);
    });
  });

  /** INVENTORY */
  describe('Inventory Management & Adjustments', () => {
    it('22. Inventory retrieval for store', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/inventory')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].availableQuantity).toBeDefined();
    });

    it('23. Authorized inventory adjustment updates stock atomically', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/admin/inventory/${variantA1.id}/adjust`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenInvManagerA}`)
        .send({ adjustmentQuantity: 15, reason: 'Restock shipment' })
        .expect(201);

      expect(res.body.quantity).toBe(65); // 50 + 15
    });

    it('24. Unauthorized inventory adjustment rejected for Manager role', async () => {
      await request(app.getHttpServer())
        .post(`/api/admin/inventory/${variantA1.id}/adjust`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenManagerA}`)
        .send({ adjustmentQuantity: 10 })
        .expect(403);
    });

    it('25. Inventory adjustment cannot result in negative stock', async () => {
      await request(app.getHttpServer())
        .post(`/api/admin/inventory/${variantA1.id}/adjust`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({ adjustmentQuantity: -500 })
        .expect(400);
    });
  });

  /** ORDERS */
  describe('Order Management & State Transitions', () => {
    it('26. Admin order listing is tenant-scoped', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/orders')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenSupportA}`)
        .expect(200);

      expect(res.body.data.some((o: any) => o.id === orderA1.id)).toBe(true);
      expect(res.body.data.some((o: any) => o.id === orderB1.id)).toBe(false);
    });

    it('27. Admin can update valid order status transitions', async () => {
      // PENDING -> CONFIRMED
      const res1 = await request(app.getHttpServer())
        .patch(`/api/admin/orders/${orderA1.id}/status`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenSupportA}`)
        .send({ status: OrderStatus.CONFIRMED })
        .expect(200);

      expect(res1.body.status).toBe('CONFIRMED');

      // CONFIRMED -> PROCESSING
      const res2 = await request(app.getHttpServer())
        .patch(`/api/admin/orders/${orderA1.id}/status`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenSupportA}`)
        .send({ status: OrderStatus.PROCESSING })
        .expect(200);

      expect(res2.body.status).toBe('PROCESSING');
    });

    it('28. Invalid order status transition rejected', async () => {
      // PROCESSING -> DELIVERED (Must go through SHIPPED first)
      await request(app.getHttpServer())
        .patch(`/api/admin/orders/${orderA1.id}/status`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenSupportA}`)
        .send({ status: OrderStatus.DELIVERED })
        .expect(400);
    });

    it('29. Admin status update cannot change payment status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/admin/orders/${orderA1.id}/status`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenSupportA}`)
        .send({ status: OrderStatus.SHIPPED })
        .expect(200);

      expect(res.body.paymentStatus).toBe('PAID');
    });

    it('30. Admin status update cannot manipulate order total', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/admin/orders/${orderA1.id}/status`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenSupportA}`)
        .send({ status: OrderStatus.DELIVERED, total: 0 })
        .expect(200);

      expect(res.body.total).toBe('1049');
    });
  });

  /** CUSTOMERS */
  describe('Customer Management', () => {
    it('31. Customer listing is tenant-scoped', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/customers')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenSupportA}`)
        .expect(200);

      expect(res.body.data.some((c: any) => c.id === customerA1.id)).toBe(true);
      expect(res.body.data.some((c: any) => c.id === customerB1.id)).toBe(false);
    });

    it('32. Customer total spent is server-derived from PAID orders', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/admin/customers/${customerA1.id}`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenSupportA}`)
        .expect(200);

      expect(res.body.totalSpent).toBe(1049);
      expect(res.body.orderCount).toBe(1);
    });
  });

  /** SHIPPING */
  describe('Shipping Rate Management', () => {
    let createdRate: any;

    it('33. Admin can create shipping rate', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/shipping-rates')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          name: 'Express Air A',
          provider: 'BlueDart',
          amount: 150,
          estimatedDaysMin: 1,
          estimatedDaysMax: 2,
        })
        .expect(201);

      createdRate = res.body;
      expect(createdRate.storeId).toBe(storeA.id);
    });

    it('34. Admin can update shipping rate', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/admin/shipping-rates/${createdRate.id}`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({ amount: 180 })
        .expect(200);

      expect(res.body.amount).toBe('180');
    });

    it('35. Customer public shipping API only returns active rates', async () => {
      // Deactivate rate
      await request(app.getHttpServer())
        .patch(`/api/admin/shipping-rates/${createdRate.id}`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({ isActive: false })
        .expect(200);

      // Public API check
      const pubRes = await request(app.getHttpServer())
        .get('/api/shipping/rates')
        .set('Host', domainA)
        .expect(200);

      expect(pubRes.body.some((r: any) => r.id === createdRate.id)).toBe(false);
    });

    it('36. Cross-tenant shipping rate manipulation rejected', async () => {
      await request(app.getHttpServer())
        .delete(`/api/admin/shipping-rates/${shippingRateB1.id}`)
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .expect(404);
    });

    it('37. Negative shipping amount rejected', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/shipping-rates')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({
          name: 'Invalid Rate',
          provider: 'FedEx',
          amount: -50,
        })
        .expect(400);
    });
  });

  /** STORE SETTINGS */
  describe('Store Profile Settings', () => {
    it('38. Admin can retrieve current store details', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/store')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .expect(200);

      expect(res.body.id).toBe(storeA.id);
      expect(res.body.domains.length).toBeGreaterThan(0);
    });

    it('39. Authorized store settings update', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/admin/store')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({ name: 'Updated Store A Name' })
        .expect(200);

      expect(res.body.name).toBe('Updated Store A Name');
    });

    it('40. Cross-tenant store modification rejected', async () => {
      // Trying to update Store B while sending Host A
      const res = await request(app.getHttpServer())
        .patch('/api/admin/store')
        .set('Host', domainA)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({ name: 'Hacked Name' })
        .expect(200);

      // Verify Store B was untouched
      const storeBData = await prisma.store.findUnique({ where: { id: storeB.id } });
      expect(storeBData?.name).toBe('Store B Admin');
    });
  });
});
