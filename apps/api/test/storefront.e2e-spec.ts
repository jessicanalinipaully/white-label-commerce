import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Storefront & Tenant Isolation (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let storeA: any;
  let storeB: any;

  let categoryA: any;
  let categoryB: any;
  let inactiveCategoryA: any;

  let productA1: any;
  let productA2: any;
  let productAInactive: any;
  let productB1: any;

  const domainA = `urbanthread-sf-${Date.now()}.localhost`;
  const domainB = `aurelia-sf-${Date.now()}.localhost`;

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

    // Create Store A
    storeA = await prisma.store.create({
      data: {
        name: 'UrbanThread Storefront',
        slug: `urbanthread-sf-${Date.now()}`,
        domains: {
          create: { domain: domainA, isPrimary: true },
        },
      },
    });

    // Create Store B
    storeB = await prisma.store.create({
      data: {
        name: 'Aurelia Luxury Storefront',
        slug: `aurelia-sf-${Date.now()}`,
        domains: {
          create: { domain: domainB, isPrimary: true },
        },
      },
    });

    // Create Categories
    categoryA = await prisma.category.create({
      data: {
        storeId: storeA.id,
        name: 'Urban Streetwear',
        slug: 'urban-streetwear',
        isActive: true,
      },
    });

    inactiveCategoryA = await prisma.category.create({
      data: {
        storeId: storeA.id,
        name: 'Archived Category',
        slug: 'archived-category',
        isActive: false,
      },
    });

    categoryB = await prisma.category.create({
      data: {
        storeId: storeB.id,
        name: 'Luxury Jewelry',
        slug: 'luxury-jewelry',
        isActive: true,
      },
    });

    // Create Products for Store A
    productA1 = await prisma.product.create({
      data: {
        storeId: storeA.id,
        categoryId: categoryA.id,
        name: 'Denim Jacket Graphic',
        slug: 'denim-jacket-graphic',
        description: 'Premium heavyweight denim streetwear jacket',
        price: 120.0,
        isActive: true,
        variants: {
          create: {
            storeId: storeA.id,
            name: 'Size M / Black',
            sku: `UT-DJ-M-${Date.now()}`,
            price: 120.0,
            attributes: { size: 'M', color: 'Black' },
            isActive: true,
            inventory: {
              create: {
                storeId: storeA.id,
                quantity: 15,
                reservedQuantity: 0,
              },
            },
          },
        },
      },
    });

    productA2 = await prisma.product.create({
      data: {
        storeId: storeA.id,
        categoryId: categoryA.id,
        name: 'Oversized Hoodie',
        slug: 'oversized-hoodie',
        description: 'Cozy oversized fleece hoodie',
        price: 85.0,
        isActive: true,
      },
    });

    productAInactive = await prisma.product.create({
      data: {
        storeId: storeA.id,
        categoryId: categoryA.id,
        name: 'Draft Unreleased Tee',
        slug: 'draft-unreleased-tee',
        description: 'Not ready for sale',
        price: 45.0,
        isActive: false,
      },
    });

    // Create Product for Store B
    productB1 = await prisma.product.create({
      data: {
        storeId: storeB.id,
        categoryId: categoryB.id,
        name: 'Diamond Solitaire Ring',
        slug: 'diamond-solitaire-ring',
        description: '18k Gold Diamond Ring',
        price: 1500.0,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    // Cleanup created data
    if (storeA?.id) {
      await prisma.inventory.deleteMany({ where: { storeId: storeA.id } });
      await prisma.productVariant.deleteMany({ where: { storeId: storeA.id } });
      await prisma.productImage.deleteMany({ where: { product: { storeId: storeA.id } } });
      await prisma.product.deleteMany({ where: { storeId: storeA.id } });
      await prisma.category.deleteMany({ where: { storeId: storeA.id } });
      await prisma.storeDomain.deleteMany({ where: { storeId: storeA.id } });
      await prisma.store.delete({ where: { id: storeA.id } });
    }
    if (storeB?.id) {
      await prisma.inventory.deleteMany({ where: { storeId: storeB.id } });
      await prisma.productVariant.deleteMany({ where: { storeId: storeB.id } });
      await prisma.productImage.deleteMany({ where: { product: { storeId: storeB.id } } });
      await prisma.product.deleteMany({ where: { storeId: storeB.id } });
      await prisma.category.deleteMany({ where: { storeId: storeB.id } });
      await prisma.storeDomain.deleteMany({ where: { storeId: storeB.id } });
      await prisma.store.delete({ where: { id: storeB.id } });
    }
    await app.close();
  });

  // ─── 1. Public Store Endpoint ──────────────────────────────────────────────

  it('GET /api/storefront/store - resolves store info based on Host header without JWT', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/storefront/store')
      .set('Host', domainA)
      .expect(200);

    expect(res.body.id).toBe(storeA.id);
    expect(res.body.name).toBe('UrbanThread Storefront');
  });

  // ─── 2. Categories Endpoint & Active Filtering ─────────────────────────────

  it('GET /api/storefront/categories - returns active categories for host, excludes inactive', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/storefront/categories')
      .set('Host', domainA)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const categoryIds = res.body.map((c: any) => c.id);

    expect(categoryIds).toContain(categoryA.id);
    expect(categoryIds).not.toContain(inactiveCategoryA.id);
    expect(categoryIds).not.toContain(categoryB.id);
  });

  // ─── 3. Tenant Catalog Isolation ──────────────────────────────────────────

  it('GET /api/storefront/products - returns ONLY active products belonging to current host', async () => {
    // Request from Store A host
    const resA = await request(app.getHttpServer())
      .get('/api/storefront/products')
      .set('Host', domainA)
      .expect(200);

    const productIdsA = resA.body.data.map((p: any) => p.id);
    expect(productIdsA).toContain(productA1.id);
    expect(productIdsA).toContain(productA2.id);
    expect(productIdsA).not.toContain(productAInactive.id); // Inactive product excluded
    expect(productIdsA).not.toContain(productB1.id); // Store B product excluded

    // Request from Store B host
    const resB = await request(app.getHttpServer())
      .get('/api/storefront/products')
      .set('Host', domainB)
      .expect(200);

    const productIdsB = resB.body.data.map((p: any) => p.id);
    expect(productIdsB).toContain(productB1.id);
    expect(productIdsB).not.toContain(productA1.id);
  });

  // ─── 4. Search Query Scoping ──────────────────────────────────────────────

  it('GET /api/storefront/products?q=... - search matches are strictly tenant-scoped', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/storefront/products?q=Denim')
      .set('Host', domainA)
      .expect(200);

    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].id).toBe(productA1.id);

    // Search for Store B item while on Store A host -> should return empty
    const res2 = await request(app.getHttpServer())
      .get('/api/storefront/products?q=Diamond')
      .set('Host', domainA)
      .expect(200);

    expect(res2.body.data.length).toBe(0);
  });

  // ─── 5. Price Filtering & Sorting ─────────────────────────────────────────

  it('GET /api/storefront/products - filters by price range and sorts correctly', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/storefront/products?minPrice=100&maxPrice=150')
      .set('Host', domainA)
      .expect(200);

    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].id).toBe(productA1.id);

    const resSort = await request(app.getHttpServer())
      .get('/api/storefront/products?sortBy=price_asc')
      .set('Host', domainA)
      .expect(200);

    expect(resSort.body.data[0].id).toBe(productA2.id); // $85 vs $120
  });

  // ─── 6. Product Detail & Variant/Inventory Lookup ─────────────────────────

  it('GET /api/storefront/products/:slug - returns product with variants & inventory', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/storefront/products/${productA1.slug}`)
      .set('Host', domainA)
      .expect(200);

    expect(res.body.id).toBe(productA1.id);
    expect(res.body.variants.length).toBe(1);
    expect(res.body.variants[0].inventory.quantity).toBe(15);
  });

  // ─── 7. Cross-Tenant Slug Access Protection ────────────────────────────────

  it('GET /api/storefront/products/:slug - returns 404 when requesting another store product slug', async () => {
    // Try accessing Store A's product slug from Store B's domain
    await request(app.getHttpServer())
      .get(`/api/storefront/products/${productA1.slug}`)
      .set('Host', domainB)
      .expect(404);
  });

  // ─── 8. Category Product Listing ──────────────────────────────────────────

  it('GET /api/storefront/category/:slug - returns category and its products for store', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/storefront/category/${categoryA.slug}`)
      .set('Host', domainA)
      .expect(200);

    expect(res.body.category.id).toBe(categoryA.id);
    expect(res.body.products.data.length).toBe(2);

    // Cross-tenant check: accessing Store A category from Store B domain -> 404
    await request(app.getHttpServer())
      .get(`/api/storefront/category/${categoryA.slug}`)
      .set('Host', domainB)
      .expect(404);
  });
});
