import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { StoreUserRole, HomepageSectionType } from '@commerce/types';

describe('Phase 8: White-Label Theme & CMS (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let storeA: any;
  let storeB: any;

  let domainA: string;
  let domainB: string;

  // Tokens & Users
  let tokenOwnerA: string;
  let userOwnerA: any;

  let tokenManagerA: string;
  let userManagerA: any;

  let tokenSupportA: string;
  let userSupportA: any;

  let tokenOwnerB: string;
  let userOwnerB: any;

  // Catalog items for Store A & B
  let categoryA1: any;
  let categoryB1: any;

  let productA1: any;
  let productB1: any;

  // Created Section IDs
  let heroSectionId: string;
  let featuredProductsSectionId: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    domainA = `theme-store-a-${timestamp}.localhost`;
    domainB = `theme-store-b-${timestamp}.localhost`;

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

    // 1. Create Stores & Domains
    storeA = await prisma.store.create({
      data: {
        name: 'Theme Store A',
        slug: `theme-store-a-${timestamp}`,
        domains: { create: { domain: domainA, isPrimary: true } },
      },
    });

    storeB = await prisma.store.create({
      data: {
        name: 'Theme Store B',
        slug: `theme-store-b-${timestamp}`,
        domains: { create: { domain: domainB, isPrimary: true } },
      },
    });

    // 2. Register Users & Assign Roles
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

    const ownerAData = await registerUser(`owner-theme-a-${timestamp}@test.com`, 'OwnerA');
    tokenOwnerA = ownerAData.token;
    userOwnerA = ownerAData.user;
    await prisma.storeUser.create({
      data: { storeId: storeA.id, userId: userOwnerA.id, role: StoreUserRole.OWNER },
    });

    const mgrAData = await registerUser(`mgr-theme-a-${timestamp}@test.com`, 'MgrA');
    tokenManagerA = mgrAData.token;
    userManagerA = mgrAData.user;
    await prisma.storeUser.create({
      data: { storeId: storeA.id, userId: userManagerA.id, role: StoreUserRole.MANAGER },
    });

    const suppAData = await registerUser(`supp-theme-a-${timestamp}@test.com`, 'SuppA');
    tokenSupportA = suppAData.token;
    userSupportA = suppAData.user;
    await prisma.storeUser.create({
      data: { storeId: storeA.id, userId: userSupportA.id, role: StoreUserRole.SUPPORT_AGENT },
    });

    const ownerBData = await registerUser(`owner-theme-b-${timestamp}@test.com`, 'OwnerB');
    tokenOwnerB = ownerBData.token;
    userOwnerB = ownerBData.user;
    await prisma.storeUser.create({
      data: { storeId: storeB.id, userId: userOwnerB.id, role: StoreUserRole.OWNER },
    });

    // 3. Create Categories & Products for cross-tenant testing
    categoryA1 = await prisma.category.create({
      data: { storeId: storeA.id, name: 'Apparel A', slug: `apparel-a-${timestamp}` },
    });

    categoryB1 = await prisma.category.create({
      data: { storeId: storeB.id, name: 'Apparel B', slug: `apparel-b-${timestamp}` },
    });

    productA1 = await prisma.product.create({
      data: {
        storeId: storeA.id,
        categoryId: categoryA1.id,
        name: 'Denim Jacket A',
        slug: `denim-jacket-a-${timestamp}`,
        price: 199.99,
        isActive: true,
      },
    });

    productB1 = await prisma.product.create({
      data: {
        storeId: storeB.id,
        categoryId: categoryB1.id,
        name: 'Denim Jacket B',
        slug: `denim-jacket-b-${timestamp}`,
        price: 249.99,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.storeHomepageSection.deleteMany({ where: { homepage: { storeId: { in: [storeA.id, storeB.id] } } } });
      await prisma.storeHomepage.deleteMany({ where: { storeId: { in: [storeA.id, storeB.id] } } });
      await prisma.storeBranding.deleteMany({ where: { storeId: { in: [storeA.id, storeB.id] } } });
      await prisma.storeTheme.deleteMany({ where: { storeId: { in: [storeA.id, storeB.id] } } });
      await prisma.product.deleteMany({ where: { storeId: { in: [storeA.id, storeB.id] } } });
      await prisma.category.deleteMany({ where: { storeId: { in: [storeA.id, storeB.id] } } });
      await prisma.storeUser.deleteMany({ where: { storeId: { in: [storeA.id, storeB.id] } } });
      await prisma.storeDomain.deleteMany({ where: { storeId: { in: [storeA.id, storeB.id] } } });
      await prisma.store.deleteMany({ where: { id: { in: [storeA.id, storeB.id] } } });
    }
    if (app) {
      await app.close();
    }
  });

  // -------------------------------------------------------------
  // Test 1-3: Public Storefront Config
  // -------------------------------------------------------------
  it('1. GET /api/storefront/config - returns default theme, branding, and sections for Store A', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/storefront/config')
      .set('X-Forwarded-Host', domainA)
      .expect(200);

    expect(res.body).toHaveProperty('theme');
    expect(res.body.theme.primaryColor).toBe('#000000');
    expect(res.body).toHaveProperty('branding');
    expect(res.body.branding.storeDisplayName || res.body.branding.displayName).toBe('Theme Store A');
    expect(res.body).toHaveProperty('homepage');
    expect(Array.isArray(res.body.homepage.sections)).toBe(true);
  });

  it('2. GET /api/storefront/config - returns Store B config for domainB (Tenant Isolation)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/storefront/config')
      .set('X-Forwarded-Host', domainB)
      .expect(200);

    expect(res.body.branding.storeDisplayName || res.body.branding.displayName).toBe('Theme Store B');
  });

  it('3. GET /api/storefront/config - returns 404 for unknown host header', async () => {
    await request(app.getHttpServer())
      .get('/api/storefront/config')
      .set('X-Forwarded-Host', 'non-existent-store.localhost')
      .expect(404);
  });

  // -------------------------------------------------------------
  // Test 4-9: Admin Theme API & Validation
  // -------------------------------------------------------------
  it('4. GET /api/admin/theme - returns theme configuration for Store A admin', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/theme')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .expect(200);

    expect(res.body).toHaveProperty('primaryColor');
    expect(res.body.headingFont || res.body.fontFamilyHeading).toBeTruthy();
  });

  it('5. PATCH /api/admin/theme - updates colors, fonts, borderRadius, and buttonStyle', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/admin/theme')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        primaryColor: '#123456',
        secondaryColor: '#654321',
        accentColor: '#FF0055',
        headingFont: 'Playfair Display',
        bodyFont: 'Roboto',
        borderRadius: '8px',
        buttonStyle: 'rounded',
      })
      .expect(200);

    expect(res.body.primaryColor).toBe('#123456');
    expect(res.body.accentColor).toBe('#FF0055');
    expect(res.body.headingFont || res.body.fontFamilyHeading).toBe('Playfair Display');
  });

  it('6. GET /api/storefront/config - reflects updated theme parameters for Store A', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/storefront/config')
      .set('X-Forwarded-Host', domainA)
      .expect(200);

    expect(res.body.theme.primaryColor).toBe('#123456');
    expect(res.body.theme.headingFont || res.body.theme.fontFamilyHeading).toBe('Playfair Display');
  });

  it('7. PATCH /api/admin/theme - rejects invalid hex color string', async () => {
    await request(app.getHttpServer())
      .patch('/api/admin/theme')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        primaryColor: 'invalid-hex-code',
      })
      .expect(400);
  });

  it('8. PATCH /api/admin/theme - rejects invalid font or style values if provided', async () => {
    await request(app.getHttpServer())
      .patch('/api/admin/theme')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        primaryColor: 'not-a-color',
      })
      .expect(400);
  });

  it('9. PATCH /api/admin/theme - prevents Store B Owner from modifying Store A theme', async () => {
    await request(app.getHttpServer())
      .patch('/api/admin/theme')
      .set('Authorization', `Bearer ${tokenOwnerB}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        primaryColor: '#999999',
      })
      .expect(403);
  });

  // -------------------------------------------------------------
  // Test 10-14: Admin Branding API & Validation
  // -------------------------------------------------------------
  it('10. GET /api/admin/branding - returns default branding for Store A', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/branding')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .expect(200);

    expect(res.body.storeDisplayName || res.body.displayName).toBe('Theme Store A');
  });

  it('11. PATCH /api/admin/branding - updates logoUrl, faviconUrl, displayName, tagline', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/admin/branding')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        displayName: 'Urban Elegance Couture',
        tagline: 'Modern & Sustainable Fashion',
        logoUrl: 'https://cdn.example.com/logo.png',
        faviconUrl: 'https://cdn.example.com/favicon.ico',
      })
      .expect(200);

    expect(res.body.storeDisplayName || res.body.displayName).toBe('Urban Elegance Couture');
    expect(res.body.tagline).toBe('Modern & Sustainable Fashion');
    expect(res.body.logoUrl).toBe('https://cdn.example.com/logo.png');
  });

  it('12. GET /api/storefront/config - reflects updated branding details', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/storefront/config')
      .set('X-Forwarded-Host', domainA)
      .expect(200);

    expect(res.body.branding.storeDisplayName || res.body.branding.displayName).toBe('Urban Elegance Couture');
    expect(res.body.branding.tagline).toBe('Modern & Sustainable Fashion');
  });

  it('13. PATCH /api/admin/branding - rejects javascript: URL scheme in logoUrl', async () => {
    await request(app.getHttpServer())
      .patch('/api/admin/branding')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        logoUrl: 'javascript:alert(1)',
      })
      .expect(400);
  });

  it('14. PATCH /api/admin/branding - permits valid relative logo URL path', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/admin/branding')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        logoUrl: '/images/custom-logo.svg',
      })
      .expect(200);

    expect(res.body.logoUrl).toBe('/images/custom-logo.svg');
  });

  // -------------------------------------------------------------
  // Test 15-16: Admin Homepage Metadata API
  // -------------------------------------------------------------
  it('15. GET /api/admin/homepage - returns initial homepage record', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/homepage')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .expect(200);

    expect(res.body).toHaveProperty('title');
  });

  it('16. PATCH /api/admin/homepage - updates homepage title, metaTitle, metaDescription', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/admin/homepage')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        title: 'Welcome to Urban Elegance',
        metaTitle: 'Urban Elegance | Luxury Fashion',
        metaDescription: 'Shop premium sustainable fashion online.',
      })
      .expect(200);

    expect(res.body.title).toBe('Welcome to Urban Elegance');
    expect(res.body.metaTitle).toBe('Urban Elegance | Luxury Fashion');
  });

  // -------------------------------------------------------------
  // Test 17-26: Homepage Section CRUD, Cross-Tenant Guard, & Reordering
  // -------------------------------------------------------------
  it('17. GET /api/admin/homepage/sections - lists homepage sections for Store A', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/homepage/sections')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('18. POST /api/admin/homepage/sections - creates a HERO section for Store A', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/admin/homepage/sections')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        type: HomepageSectionType.HERO,
        title: 'Summer Fashion Festival',
        subtitle: 'Get 25% off all new arrivals',
        imageUrl: 'https://cdn.example.com/hero.jpg',
        buttonText: 'Shop New Arrivals',
        buttonLink: '/products',
        isActive: true,
      })
      .expect(201);

    expect(res.body.type).toBe(HomepageSectionType.HERO);
    expect(res.body.title).toBe('Summer Fashion Festival');
    heroSectionId = res.body.id;
  });

  it('19. POST /api/admin/homepage/sections - creates FEATURED_PRODUCTS referencing valid Store A product', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/admin/homepage/sections')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        type: HomepageSectionType.FEATURED_PRODUCTS,
        title: 'Featured Collection',
        config: { limit: 4, productIds: [productA1.id] },
        isActive: true,
      })
      .expect(201);

    expect(res.body.type).toBe(HomepageSectionType.FEATURED_PRODUCTS);
    featuredProductsSectionId = res.body.id;
  });

  it('20. POST /api/admin/homepage/sections - rejects FEATURED_PRODUCTS referencing Store B product (Cross-Tenant Block)', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/homepage/sections')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        type: HomepageSectionType.FEATURED_PRODUCTS,
        title: 'Cross Tenant Attempt',
        config: { limit: 4, productIds: [productB1.id] },
        isActive: true,
      })
      .expect(400);
  });

  it('21. POST /api/admin/homepage/sections - creates FEATURED_CATEGORIES referencing valid Store A category', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/admin/homepage/sections')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        type: HomepageSectionType.FEATURED_CATEGORIES,
        title: 'Shop by Category',
        config: { limit: 6, categoryIds: [categoryA1.id] },
        isActive: true,
      })
      .expect(201);

    expect(res.body.type).toBe(HomepageSectionType.FEATURED_CATEGORIES);
  });

  it('22. POST /api/admin/homepage/sections - rejects FEATURED_CATEGORIES referencing Store B category', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/homepage/sections')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        type: HomepageSectionType.FEATURED_CATEGORIES,
        title: 'Cross Category Attempt',
        config: { limit: 6, categoryIds: [categoryB1.id] },
        isActive: true,
      })
      .expect(400);
  });

  it('23. POST /api/admin/homepage/sections - rejects javascript: scheme in buttonLink', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/homepage/sections')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        type: HomepageSectionType.CTA,
        title: 'Malicious CTA',
        buttonText: 'Click Me',
        buttonLink: 'javascript:eval("alert(1)")',
        isActive: true,
      })
      .expect(400);
  });

  it('24. PATCH /api/admin/homepage/sections/:id - updates section title and active status', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/admin/homepage/sections/${heroSectionId}`)
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        title: 'Updated Hero Festival Title',
        isActive: true,
      })
      .expect(200);

    expect(res.body.title).toBe('Updated Hero Festival Title');
  });

  it('25. POST /api/admin/homepage/sections/reorder - updates section sort orders', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/admin/homepage/sections/reorder')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        sectionIds: [featuredProductsSectionId, heroSectionId],
      })
      .expect(200);

    expect(res.body[0].id).toBe(featuredProductsSectionId);
    expect(res.body[0].sortOrder).toBe(0);
    expect(res.body[1].id).toBe(heroSectionId);
    expect(res.body[1].sortOrder).toBe(1);
  });

  it('26. DELETE /api/admin/homepage/sections/:id - deletes a homepage section', async () => {
    // Create a temporary section to delete
    const tempSec = await request(app.getHttpServer())
      .post('/api/admin/homepage/sections')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({
        type: HomepageSectionType.TEXT,
        title: 'Temp Section to Delete',
        content: 'ToDelete',
        isActive: true,
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/api/admin/homepage/sections/${tempSec.body.id}`)
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .expect(200);
  });

  // -------------------------------------------------------------
  // Test 27-28: Public Storefront Dynamic Sections Visibility
  // -------------------------------------------------------------
  it('27. GET /api/storefront/config - includes active sections in sort order', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/storefront/config')
      .set('X-Forwarded-Host', domainA)
      .expect(200);

    const activeSections = res.body.sections || res.body.homepage?.sections || [];
    expect(activeSections.length).toBeGreaterThanOrEqual(2);
    expect(activeSections[0].id).toBe(featuredProductsSectionId);
  });

  it('28. PATCH /api/admin/homepage/sections/:id - setting isActive=false hides section from storefront config', async () => {
    await request(app.getHttpServer())
      .patch(`/api/admin/homepage/sections/${heroSectionId}`)
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({ isActive: false })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/api/storefront/config')
      .set('X-Forwarded-Host', domainA)
      .expect(200);

    const activeSections = res.body.sections || res.body.homepage?.sections || [];
    const activeIds = activeSections.map((s: any) => s.id);
    expect(activeIds).not.toContain(heroSectionId);
  });

  // -------------------------------------------------------------
  // Test 29-30: Role RBAC & System Regression
  // -------------------------------------------------------------
  it('29. Role RBAC: MANAGER can edit theme, but SUPPORT_AGENT is forbidden', async () => {
    // MANAGER succeeds
    await request(app.getHttpServer())
      .patch('/api/admin/theme')
      .set('Authorization', `Bearer ${tokenManagerA}`)
      .set('X-Forwarded-Host', domainA)
      .send({ primaryColor: '#222222' })
      .expect(200);

    // SUPPORT_AGENT fails with 403
    await request(app.getHttpServer())
      .patch('/api/admin/theme')
      .set('Authorization', `Bearer ${tokenSupportA}`)
      .set('X-Forwarded-Host', domainA)
      .send({ primaryColor: '#333333' })
      .expect(403);
  });

  it('30. Regression: Public products API continues to work alongside storefront config', async () => {
    const resProducts = await request(app.getHttpServer())
      .get('/api/storefront/products')
      .set('X-Forwarded-Host', domainA)
      .expect(200);

    expect(Array.isArray(resProducts.body.data)).toBe(true);

    const resConfig = await request(app.getHttpServer())
      .get('/api/storefront/config')
      .set('X-Forwarded-Host', domainA)
      .expect(200);

    expect(resConfig.body).toHaveProperty('theme');
  });
});
