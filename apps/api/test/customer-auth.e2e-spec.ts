import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Customer Registration & Authentication Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const domainA = 'urbanthread.localhost';
  const domainB = 'aurelia.localhost';
  const newCustomerEmail = 'david.customer@example.com';
  let registeredToken: string;

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

    // Clean up test customer if previously created
    const existingUser = await prisma.user.findUnique({ where: { email: newCustomerEmail } });
    if (existingUser) {
      await prisma.customer.deleteMany({ where: { userId: existingUser.id } });
      await prisma.user.delete({ where: { id: existingUser.id } });
    }
  });

  afterAll(async () => {
    // Clean up created test records
    const testUser = await prisma.user.findUnique({ where: { email: newCustomerEmail } });
    if (testUser) {
      await prisma.customer.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
    if (app) {
      await app.close();
    }
  });

  it('1. Seeded customer Alice can login successfully', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('X-Forwarded-Host', domainA)
      .send({ email: 'alice@urbanthread.com', password: 'Password123!' })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('alice@urbanthread.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('2. Login fails with generic error for incorrect password', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('X-Forwarded-Host', domainA)
      .send({ email: 'alice@urbanthread.com', password: 'WrongPassword999!' })
      .expect(401);

    expect(res.body.message).toBe('Invalid email or password');
  });

  it('3. Login fails with generic error for non-existent user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('X-Forwarded-Host', domainA)
      .send({ email: 'nonexistent@example.com', password: 'Password123!' })
      .expect(401);

    expect(res.body.message).toBe('Invalid email or password');
  });

  it('4. Registration rejects invalid email format', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('X-Forwarded-Host', domainA)
      .send({ name: 'David Test', email: 'not-an-email', password: 'Password123!' })
      .expect(400);

    expect(res.body.message).toBeDefined();
  });

  it('5. Registration rejects weak password missing required complexity', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('X-Forwarded-Host', domainA)
      .send({ name: 'David Test', email: 'david.weak@example.com', password: 'simplepassword' })
      .expect(400);

    expect(res.body.message).toBeDefined();
  });

  it('6. Successful customer registration creates User and Store Customer records', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('X-Forwarded-Host', domainA)
      .send({
        name: 'David Test',
        email: '   David.Customer@example.com   ', // testing trim & lowercase normalization
        password: 'Password123!',
      })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(newCustomerEmail);
    expect(res.body.user.passwordHash).toBeUndefined();

    registeredToken = res.body.accessToken;
  });

  it('7. Duplicate email registration on same store is rejected with 409 Conflict', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('X-Forwarded-Host', domainA)
      .send({
        name: 'David Duplicate',
        email: newCustomerEmail,
        password: 'Password123!',
      })
      .expect(409);

    expect(res.body.message).toBe('An account with this email already exists');
  });

  it('8. Newly registered customer can login with normalized email', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('X-Forwarded-Host', domainA)
      .send({
        email: 'DAVID.CUSTOMER@EXAMPLE.COM',
        password: 'Password123!',
      })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(newCustomerEmail);
  });

  it('9. Authenticated customer can retrieve profile without password exposure', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customers/me')
      .set('X-Forwarded-Host', domainA)
      .set('Authorization', `Bearer ${registeredToken}`)
      .expect(200);

    expect(res.body.firstName).toBe('David');
    expect(res.body.lastName).toBe('Test');
    expect(res.body.user.email).toBe(newCustomerEmail);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('10. Customer tenant isolation: customer cannot access Store A admin dashboard', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .set('X-Forwarded-Host', domainA)
      .set('Authorization', `Bearer ${registeredToken}`)
      .expect(403);
  });

  it('11. Customer tenant isolation: Store A shipping address is isolated and not visible on Store B host', async () => {
    // 1. Create shipping address on Store A
    const addrRes = await request(app.getHttpServer())
      .post('/api/customers/me/addresses')
      .set('X-Forwarded-Host', domainA)
      .set('Authorization', `Bearer ${registeredToken}`)
      .send({
        firstName: 'David',
        lastName: 'Test',
        phone: '9876543210',
        addressLine1: '123 Store A Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
      })
      .expect(201);

    const storeAAddressId = addrRes.body.id;

    // 2. Fetch addresses on Store A → address is present
    const storeAAddrs = await request(app.getHttpServer())
      .get('/api/customers/me/addresses')
      .set('X-Forwarded-Host', domainA)
      .set('Authorization', `Bearer ${registeredToken}`)
      .expect(200);

    expect(storeAAddrs.body).toHaveLength(1);
    expect(storeAAddrs.body[0].id).toBe(storeAAddressId);

    // 3. Fetch addresses on Store B using same customer JWT → Store A address is NOT exposed
    const storeBAddrs = await request(app.getHttpServer())
      .get('/api/customers/me/addresses')
      .set('X-Forwarded-Host', domainB)
      .set('Authorization', `Bearer ${registeredToken}`)
      .expect(200);

    expect(storeBAddrs.body).toHaveLength(0);

    // 4. Attempting to delete Store A address via Store B host header fails with 404
    await request(app.getHttpServer())
      .delete(`/api/customers/me/addresses/${storeAAddressId}`)
      .set('X-Forwarded-Host', domainB)
      .set('Authorization', `Bearer ${registeredToken}`)
      .expect(404);
  });

  it('12. Customer address creation persists Google Maps latitude, longitude, and placeId', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/customers/me/addresses')
      .set('X-Forwarded-Host', domainA)
      .set('Authorization', `Bearer ${registeredToken}`)
      .send({
        firstName: 'David',
        lastName: 'Test',
        phone: '9876543210',
        addressLine1: 'Christ University Kengeri Campus',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560074',
        country: 'India',
        latitude: 12.8631,
        longitude: 77.4381,
        placeId: 'ChIJgUb9-W8_rjsRk2_7k876543',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.addressLine1).toBe('Christ University Kengeri Campus');
    expect(res.body.latitude).toBe('12.8631');
    expect(res.body.longitude).toBe('77.4381');
    expect(res.body.placeId).toBe('ChIJgUb9-W8_rjsRk2_7k876543');
  });
});
