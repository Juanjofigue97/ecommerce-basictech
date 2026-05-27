-- AlterTable
ALTER TABLE "store_settings" ALTER COLUMN "name" SET DEFAULT 'BasicWear',
ALTER COLUMN "email" SET DEFAULT 'info@basicwear.com',
ALTER COLUMN "phone" SET DEFAULT '+57 300 000 0000',
ALTER COLUMN "address" SET DEFAULT 'Calle 72 #10-34, Bogotá',
ALTER COLUMN "description" SET DEFAULT 'Tu tienda de ropa y accesorios de confianza',
ALTER COLUMN "timezone" SET DEFAULT 'america-bogota';

-- CreateTable
CREATE TABLE "hero_slides" (
    "id" TEXT NOT NULL,
    "badge" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "image" TEXT NOT NULL,
    "gradient" TEXT NOT NULL DEFAULT 'from-violet-900 via-purple-900 to-slate-900',
    "ctaText" TEXT NOT NULL DEFAULT 'Ver más',
    "ctaHref" TEXT NOT NULL DEFAULT '/products',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_slides_pkey" PRIMARY KEY ("id")
);
