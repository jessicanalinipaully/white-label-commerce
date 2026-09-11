import { PrismaClient, StoreStatus, StoreUserRole, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for Phase 2 Multi-Tenancy...');

  const saltRounds = 10;
  const commonPasswordHash = await bcrypt.hash('Password123!', saltRounds);

  // 1. Create Users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@urbanthread.com' },
    update: { passwordHash: commonPasswordHash },
    create: {
      email: 'alice@urbanthread.com',
      passwordHash: commonPasswordHash,
      firstName: 'Alice',
      lastName: 'Urban',
      role: UserRole.USER,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@aurelia.com' },
    update: { passwordHash: commonPasswordHash },
    create: {
      email: 'bob@aurelia.com',
      passwordHash: commonPasswordHash,
      firstName: 'Bob',
      lastName: 'Aurelia',
      role: UserRole.USER,
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: 'charlie@shared.com' },
    update: { passwordHash: commonPasswordHash },
    create: {
      email: 'charlie@shared.com',
      passwordHash: commonPasswordHash,
      firstName: 'Charlie',
      lastName: 'Shared',
      role: UserRole.USER,
    },
  });

  console.log('✅ Test Users created/updated:');
  console.log('   - Alice: alice@urbanthread.com / Password123!');
  console.log('   - Bob:   bob@aurelia.com / Password123!');
  console.log('   - Charlie: charlie@shared.com / Password123!');

  // 2. Create Store 1: UrbanThread
  const urbanThreadStore = await prisma.store.upsert({
    where: { slug: 'urbanthread' },
    update: { name: 'UrbanThread', status: StoreStatus.ACTIVE },
    create: {
      name: 'UrbanThread',
      slug: 'urbanthread',
      status: StoreStatus.ACTIVE,
    },
  });

  await prisma.storeDomain.upsert({
    where: { domain: 'urbanthread.localhost' },
    update: { isPrimary: true },
    create: {
      storeId: urbanThreadStore.id,
      domain: 'urbanthread.localhost',
      isPrimary: true,
    },
  });

  await prisma.storeUser.upsert({
    where: {
      storeId_userId: {
        storeId: urbanThreadStore.id,
        userId: alice.id,
      },
    },
    update: { role: StoreUserRole.OWNER },
    create: {
      storeId: urbanThreadStore.id,
      userId: alice.id,
      role: StoreUserRole.OWNER,
    },
  });

  await prisma.storeUser.upsert({
    where: {
      storeId_userId: {
        storeId: urbanThreadStore.id,
        userId: charlie.id,
      },
    },
    update: { role: StoreUserRole.MANAGER },
    create: {
      storeId: urbanThreadStore.id,
      userId: charlie.id,
      role: StoreUserRole.MANAGER,
    },
  });

  console.log('✅ Store 1 Created: UrbanThread (urbanthread.localhost)');

  // 3. Create Store 2: Aurelia
  const aureliaStore = await prisma.store.upsert({
    where: { slug: 'aurelia' },
    update: { name: 'Aurelia', status: StoreStatus.ACTIVE },
    create: {
      name: 'Aurelia',
      slug: 'aurelia',
      status: StoreStatus.ACTIVE,
    },
  });

  await prisma.storeDomain.upsert({
    where: { domain: 'aurelia.localhost' },
    update: { isPrimary: true },
    create: {
      storeId: aureliaStore.id,
      domain: 'aurelia.localhost',
      isPrimary: true,
    },
  });

  await prisma.storeUser.upsert({
    where: {
      storeId_userId: {
        storeId: aureliaStore.id,
        userId: bob.id,
      },
    },
    update: { role: StoreUserRole.OWNER },
    create: {
      storeId: aureliaStore.id,
      userId: bob.id,
      role: StoreUserRole.OWNER,
    },
  });

  await prisma.storeUser.upsert({
    where: {
      storeId_userId: {
        storeId: aureliaStore.id,
        userId: charlie.id,
      },
    },
    update: { role: StoreUserRole.SUPPORT_AGENT },
    create: {
      storeId: aureliaStore.id,
      userId: charlie.id,
      role: StoreUserRole.SUPPORT_AGENT,
    },
  });

  console.log('✅ Store 2 Created: Aurelia (aurelia.localhost)');
  console.log('🎉 Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
