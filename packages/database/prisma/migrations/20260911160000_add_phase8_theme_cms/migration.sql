-- CreateEnum
CREATE TYPE "HomepageSectionType" AS ENUM ('HERO', 'FEATURED_PRODUCTS', 'FEATURED_CATEGORIES', 'PROMO_BANNER', 'TEXT', 'IMAGE', 'CTA');

-- CreateTable
CREATE TABLE "StoreTheme" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default Theme',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "primaryColor" TEXT NOT NULL DEFAULT '#4F46E5',
    "secondaryColor" TEXT NOT NULL DEFAULT '#06B6D4',
    "accentColor" TEXT NOT NULL DEFAULT '#F59E0B',
    "backgroundColor" TEXT NOT NULL DEFAULT '#0F172A',
    "textColor" TEXT NOT NULL DEFAULT '#F8FAFC',
    "headingFont" TEXT NOT NULL DEFAULT 'INTER',
    "bodyFont" TEXT NOT NULL DEFAULT 'INTER',
    "borderRadius" TEXT NOT NULL DEFAULT 'MEDIUM',
    "buttonStyle" TEXT NOT NULL DEFAULT 'SOLID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreBranding" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "storeDisplayName" TEXT,
    "tagline" TEXT,
    "socialPreviewImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreBranding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreHomepage" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Home',
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreHomepage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreHomepageSection" (
    "id" TEXT NOT NULL,
    "homepageId" TEXT NOT NULL,
    "type" "HomepageSectionType" NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "content" TEXT,
    "imageUrl" TEXT,
    "buttonText" TEXT,
    "buttonUrl" TEXT,
    "productId" TEXT,
    "categoryId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreHomepageSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreTheme_storeId_key" ON "StoreTheme"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreBranding_storeId_key" ON "StoreBranding"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreHomepage_storeId_key" ON "StoreHomepage"("storeId");

-- CreateIndex
CREATE INDEX "StoreHomepageSection_homepageId_idx" ON "StoreHomepageSection"("homepageId");

-- CreateIndex
CREATE INDEX "StoreHomepageSection_productId_idx" ON "StoreHomepageSection"("productId");

-- CreateIndex
CREATE INDEX "StoreHomepageSection_categoryId_idx" ON "StoreHomepageSection"("categoryId");

-- AddForeignKey
ALTER TABLE "StoreTheme" ADD CONSTRAINT "StoreTheme_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreBranding" ADD CONSTRAINT "StoreBranding_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreHomepage" ADD CONSTRAINT "StoreHomepage_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreHomepageSection" ADD CONSTRAINT "StoreHomepageSection_homepageId_fkey" FOREIGN KEY ("homepageId") REFERENCES "StoreHomepage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreHomepageSection" ADD CONSTRAINT "StoreHomepageSection_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreHomepageSection" ADD CONSTRAINT "StoreHomepageSection_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
