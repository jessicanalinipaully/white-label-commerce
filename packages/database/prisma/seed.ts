import { PrismaClient, StoreStatus, StoreUserRole, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed (Phase 2 + Phase 3)...');

  const saltRounds = 10;
  const commonPasswordHash = await bcrypt.hash('Password123!', saltRounds);

  // ─── Phase 2: Users ───────────────────────────────────────────────────────
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

  console.log('✅ Users: Alice, Bob, Charlie seeded');

  // ─── Phase 2: Stores ──────────────────────────────────────────────────────
  const urbanThread = await prisma.store.upsert({
    where: { slug: 'urbanthread' },
    update: { name: 'UrbanThread', status: StoreStatus.ACTIVE },
    create: { name: 'UrbanThread', slug: 'urbanthread', status: StoreStatus.ACTIVE },
  });

  await prisma.storeDomain.upsert({
    where: { domain: 'urbanthread.localhost' },
    update: { isPrimary: true },
    create: { storeId: urbanThread.id, domain: 'urbanthread.localhost', isPrimary: true },
  });

  await prisma.storeUser.upsert({
    where: { storeId_userId: { storeId: urbanThread.id, userId: alice.id } },
    update: { role: StoreUserRole.OWNER },
    create: { storeId: urbanThread.id, userId: alice.id, role: StoreUserRole.OWNER },
  });

  await prisma.storeUser.upsert({
    where: { storeId_userId: { storeId: urbanThread.id, userId: charlie.id } },
    update: { role: StoreUserRole.MANAGER },
    create: { storeId: urbanThread.id, userId: charlie.id, role: StoreUserRole.MANAGER },
  });

  const aurelia = await prisma.store.upsert({
    where: { slug: 'aurelia' },
    update: { name: 'Aurelia', status: StoreStatus.ACTIVE },
    create: { name: 'Aurelia', slug: 'aurelia', status: StoreStatus.ACTIVE },
  });

  await prisma.storeDomain.upsert({
    where: { domain: 'aurelia.localhost' },
    update: { isPrimary: true },
    create: { storeId: aurelia.id, domain: 'aurelia.localhost', isPrimary: true },
  });

  await prisma.storeUser.upsert({
    where: { storeId_userId: { storeId: aurelia.id, userId: bob.id } },
    update: { role: StoreUserRole.OWNER },
    create: { storeId: aurelia.id, userId: bob.id, role: StoreUserRole.OWNER },
  });

  await prisma.storeUser.upsert({
    where: { storeId_userId: { storeId: aurelia.id, userId: charlie.id } },
    update: { role: StoreUserRole.SUPPORT_AGENT },
    create: { storeId: aurelia.id, userId: charlie.id, role: StoreUserRole.SUPPORT_AGENT },
  });

  console.log('✅ Stores: UrbanThread (urbanthread.localhost), Aurelia (aurelia.localhost) seeded');

  // ─── Phase 3: UrbanThread Categories ─────────────────────────────────────
  const utMen = await prisma.category.upsert({
    where: { storeId_slug: { storeId: urbanThread.id, slug: 'men' } },
    update: { name: 'Men', isActive: true },
    create: { storeId: urbanThread.id, name: 'Men', slug: 'men', description: "Men's clothing collection", isActive: true },
  });
  const utWomen = await prisma.category.upsert({
    where: { storeId_slug: { storeId: urbanThread.id, slug: 'women' } },
    update: { name: 'Women', isActive: true },
    create: { storeId: urbanThread.id, name: 'Women', slug: 'women', description: "Women's clothing collection", isActive: true },
  });
  const utAccessories = await prisma.category.upsert({
    where: { storeId_slug: { storeId: urbanThread.id, slug: 'accessories' } },
    update: { name: 'Accessories', isActive: true },
    create: { storeId: urbanThread.id, name: 'Accessories', slug: 'accessories', description: 'Fashion accessories', isActive: true },
  });

  // ─── Phase 3: Aurelia Categories ──────────────────────────────────────────
  const aMen = await prisma.category.upsert({
    where: { storeId_slug: { storeId: aurelia.id, slug: 'men' } },
    update: { name: 'Men', isActive: true },
    create: { storeId: aurelia.id, name: 'Men', slug: 'men', description: "Men's fashion", isActive: true },
  });
  const aWomen = await prisma.category.upsert({
    where: { storeId_slug: { storeId: aurelia.id, slug: 'women' } },
    update: { name: 'Women', isActive: true },
    create: { storeId: aurelia.id, name: 'Women', slug: 'women', description: "Women's fashion", isActive: true },
  });
  const aAccessories = await prisma.category.upsert({
    where: { storeId_slug: { storeId: aurelia.id, slug: 'accessories' } },
    update: { name: 'Accessories', isActive: true },
    create: { storeId: aurelia.id, name: 'Accessories', slug: 'accessories', description: 'Premium accessories', isActive: true },
  });

  console.log('✅ Categories seeded for UrbanThread and Aurelia');

  // ─── Phase 3: UrbanThread Products ───────────────────────────────────────
  const tshirt = await prisma.product.upsert({
    where: { storeId_slug: { storeId: urbanThread.id, slug: 'classic-black-tshirt' } },
    update: { name: 'Classic Black T-Shirt', price: 29.99 },
    create: {
      storeId: urbanThread.id,
      categoryId: utMen.id,
      name: 'Classic Black T-Shirt',
      slug: 'classic-black-tshirt',
      description: 'A timeless classic black t-shirt made from premium cotton.',
      shortDescription: 'Premium cotton classic tee',
      sku: 'UT-TSHIRT-BLK',
      price: 29.99,
      compareAtPrice: 39.99,
      isActive: true,
    },
  });

  const hoodie = await prisma.product.upsert({
    where: { storeId_slug: { storeId: urbanThread.id, slug: 'oversized-hoodie' } },
    update: { name: 'Oversized Hoodie', price: 59.99 },
    create: {
      storeId: urbanThread.id,
      categoryId: utMen.id,
      name: 'Oversized Hoodie',
      slug: 'oversized-hoodie',
      description: 'Comfortable oversized hoodie perfect for casual wear.',
      sku: 'UT-HOODIE-GRY',
      price: 59.99,
      isActive: true,
    },
  });

  const denim = await prisma.product.upsert({
    where: { storeId_slug: { storeId: urbanThread.id, slug: 'denim-jacket' } },
    update: { name: 'Denim Jacket', price: 89.99 },
    create: {
      storeId: urbanThread.id,
      categoryId: utWomen.id,
      name: 'Denim Jacket',
      slug: 'denim-jacket',
      description: 'Classic denim jacket with a modern fit.',
      sku: 'UT-DENIM-JKT',
      price: 89.99,
      compareAtPrice: 119.99,
      isActive: true,
    },
  });

  // ─── Phase 3: Aurelia Products ────────────────────────────────────────────
  const linen = await prisma.product.upsert({
    where: { storeId_slug: { storeId: aurelia.id, slug: 'linen-shirt' } },
    update: { name: 'Linen Shirt', price: 49.99 },
    create: {
      storeId: aurelia.id,
      categoryId: aMen.id,
      name: 'Linen Shirt',
      slug: 'linen-shirt',
      description: 'Breathable linen shirt, perfect for summer.',
      sku: 'AU-LINEN-SHIRT',
      price: 49.99,
      isActive: true,
    },
  });

  const dress = await prisma.product.upsert({
    where: { storeId_slug: { storeId: aurelia.id, slug: 'summer-dress' } },
    update: { name: 'Summer Dress', price: 69.99 },
    create: {
      storeId: aurelia.id,
      categoryId: aWomen.id,
      name: 'Summer Dress',
      slug: 'summer-dress',
      description: 'Elegant summer dress with floral pattern.',
      sku: 'AU-SUMMER-DRESS',
      price: 69.99,
      compareAtPrice: 89.99,
      isActive: true,
    },
  });

  const bag = await prisma.product.upsert({
    where: { storeId_slug: { storeId: aurelia.id, slug: 'leather-bag' } },
    update: { name: 'Leather Bag', price: 149.99 },
    create: {
      storeId: aurelia.id,
      categoryId: aAccessories.id,
      name: 'Leather Bag',
      slug: 'leather-bag',
      description: 'Genuine leather bag with multiple compartments.',
      sku: 'AU-LEATHER-BAG',
      price: 149.99,
      isActive: true,
    },
  });

  console.log('✅ Products seeded for UrbanThread and Aurelia');

  // ─── Phase 3: UrbanThread T-Shirt Variants + Inventory ───────────────────
  const tshirtSizes = ['S', 'M', 'L', 'XL'];
  for (const size of tshirtSizes) {
    const sku = `UT-TSHIRT-BLK-${size}`;
    const variant = await prisma.productVariant.upsert({
      where: { storeId_sku: { storeId: urbanThread.id, sku } },
      update: { name: `Classic Black T-Shirt - ${size}` },
      create: {
        storeId: urbanThread.id,
        productId: tshirt.id,
        name: `Classic Black T-Shirt - ${size}`,
        sku,
        price: 29.99,
        attributes: { size, color: 'Black' },
        isActive: true,
      },
    });

    await prisma.inventory.upsert({
      where: { variantId: variant.id },
      update: {},
      create: {
        storeId: urbanThread.id,
        variantId: variant.id,
        quantity: 50,
        reservedQuantity: 0,
        lowStockThreshold: 5,
      },
    });
  }

  // Hoodie Variants
  for (const size of ['S', 'M', 'L', 'XL']) {
    const sku = `UT-HOODIE-GRY-${size}`;
    const variant = await prisma.productVariant.upsert({
      where: { storeId_sku: { storeId: urbanThread.id, sku } },
      update: {},
      create: {
        storeId: urbanThread.id,
        productId: hoodie.id,
        name: `Oversized Hoodie - ${size}`,
        sku,
        price: 59.99,
        attributes: { size, color: 'Grey' },
        isActive: true,
      },
    });
    await prisma.inventory.upsert({
      where: { variantId: variant.id },
      update: {},
      create: { storeId: urbanThread.id, variantId: variant.id, quantity: 30, reservedQuantity: 0, lowStockThreshold: 3 },
    });
  }

  // Denim Jacket Variants
  for (const size of ['XS', 'S', 'M', 'L']) {
    const sku = `UT-DENIM-JKT-${size}`;
    const variant = await prisma.productVariant.upsert({
      where: { storeId_sku: { storeId: urbanThread.id, sku } },
      update: {},
      create: {
        storeId: urbanThread.id,
        productId: denim.id,
        name: `Denim Jacket - ${size}`,
        sku,
        price: 89.99,
        attributes: { size, color: 'Indigo Blue' },
        isActive: true,
      },
    });
    await prisma.inventory.upsert({
      where: { variantId: variant.id },
      update: {},
      create: { storeId: urbanThread.id, variantId: variant.id, quantity: 20, reservedQuantity: 0, lowStockThreshold: 3 },
    });
  }

  // ─── Phase 3: Aurelia Variants + Inventory ────────────────────────────────
  for (const size of ['S', 'M', 'L']) {
    const sku = `AU-LINEN-SHIRT-${size}`;
    const variant = await prisma.productVariant.upsert({
      where: { storeId_sku: { storeId: aurelia.id, sku } },
      update: {},
      create: {
        storeId: aurelia.id,
        productId: linen.id,
        name: `Linen Shirt - ${size}`,
        sku,
        price: 49.99,
        attributes: { size, color: 'White' },
        isActive: true,
      },
    });
    await prisma.inventory.upsert({
      where: { variantId: variant.id },
      update: {},
      create: { storeId: aurelia.id, variantId: variant.id, quantity: 25, reservedQuantity: 0, lowStockThreshold: 5 },
    });
  }

  for (const color of ['Floral Blue', 'Floral Pink']) {
    const sku = `AU-SUMMER-DRESS-${color.replace(' ', '-').toUpperCase()}`;
    const variant = await prisma.productVariant.upsert({
      where: { storeId_sku: { storeId: aurelia.id, sku } },
      update: {},
      create: {
        storeId: aurelia.id,
        productId: dress.id,
        name: `Summer Dress - ${color}`,
        sku,
        price: 69.99,
        attributes: { size: 'One Size', color },
        isActive: true,
      },
    });
    await prisma.inventory.upsert({
      where: { variantId: variant.id },
      update: {},
      create: { storeId: aurelia.id, variantId: variant.id, quantity: 15, reservedQuantity: 0, lowStockThreshold: 3 },
    });
  }

  const bagVariant = await prisma.productVariant.upsert({
    where: { storeId_sku: { storeId: aurelia.id, sku: 'AU-LEATHER-BAG-TAN' } },
    update: {},
    create: {
      storeId: aurelia.id,
      productId: bag.id,
      name: 'Leather Bag - Tan',
      sku: 'AU-LEATHER-BAG-TAN',
      price: 149.99,
      attributes: { color: 'Tan' },
      isActive: true,
    },
  });
  await prisma.inventory.upsert({
    where: { variantId: bagVariant.id },
    update: {},
    create: { storeId: aurelia.id, variantId: bagVariant.id, quantity: 10, reservedQuantity: 0, lowStockThreshold: 2 },
  });

  console.log('✅ Product Variants and Inventory seeded');
  console.log('🎉 Full database seed completed successfully!');
  console.log('');
  console.log('📋 Development Credentials:');
  console.log('   Alice (UrbanThread OWNER): alice@urbanthread.com / Password123!');
  console.log('   Bob (Aurelia OWNER):       bob@aurelia.com / Password123!');
  console.log('   Charlie (Multi-store):     charlie@shared.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
