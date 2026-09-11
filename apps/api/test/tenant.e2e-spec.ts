import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Tenant Security & Isolation (e2e)', () => {
  let app: INestApplication;
  let aliceToken: string;
  let bobToken: string;

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

    // Login Alice
    const aliceRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'alice@urbanthread.com', password: 'Password123!' });
    aliceToken = aliceRes.body.accessToken;

    // Login Bob
    const bobRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'bob@aurelia.com', password: 'Password123!' });
    bobToken = bobRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // TEST 1: Alice accessing urbanthread.localhost → succeeds
  it('TEST 1: Alice accessing urbanthread.localhost succeeds with UrbanThread store context', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/tenant')
      .set('Host', 'urbanthread.localhost')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    expect(res.body.store.slug).toBe('urbanthread');
    expect(res.body.store.name).toBe('UrbanThread');
    expect(res.body.membership.role).toBe('OWNER');
  });

  // TEST 2: Bob accessing aurelia.localhost → succeeds
  it('TEST 2: Bob accessing aurelia.localhost succeeds with Aurelia store context', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/tenant')
      .set('Host', 'aurelia.localhost')
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(200);

    expect(res.body.store.slug).toBe('aurelia');
    expect(res.body.store.name).toBe('Aurelia');
    expect(res.body.membership.role).toBe('OWNER');
  });

  // TEST 3: Alice attempting to access Aurelia through a manipulated storeId query parameter → must NOT switch tenant
  it('TEST 3: Alice attempting query parameter manipulation storeId=aurelia on urbanthread.localhost does NOT switch tenant', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/tenant?storeId=aurelia-fake-id')
      .set('Host', 'urbanthread.localhost')
      .set('X-Store-Id', 'aurelia-fake-id')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    // Context MUST remain UrbanThread because server resolves strictly by Host header
    expect(res.body.store.slug).toBe('urbanthread');
    expect(res.body.store.name).toBe('UrbanThread');
  });

  // TEST 4: Alice attempting to access aurelia.localhost → receives 403 Forbidden
  it('TEST 4: Alice attempting to access aurelia.localhost receives 403 Forbidden', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/tenant')
      .set('Host', 'aurelia.localhost')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(403);

    expect(res.body.message).toContain('User is not a member of this store');
  });

  // TEST 5: Unknown hostname/domain → tenant resolution fails safely with 404
  it('TEST 5: Request with unknown hostname unknown.localhost fails safely with 404', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/tenant')
      .set('Host', 'unknown.localhost')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(404);

    expect(res.body.message).toContain('Store not found');
  });

  // TEST 6: Domain lookup is case-insensitive & normalized correctly
  it('TEST 6: Host header with uppercase and port URBANTHREAD.LOCALHOST:4000 is normalized correctly', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/tenant')
      .set('Host', 'URBANTHREAD.LOCALHOST:4000')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    expect(res.body.store.slug).toBe('urbanthread');
    expect(res.body.domain.domain).toBe('urbanthread.localhost');
  });
});
