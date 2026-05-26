-- CreateTable
CREATE TABLE "store_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "name" TEXT NOT NULL DEFAULT 'BasicTechShop',
    "email" TEXT NOT NULL DEFAULT 'info@basictechshop.com',
    "phone" TEXT NOT NULL DEFAULT '+51 999 888 777',
    "address" TEXT NOT NULL DEFAULT 'Av. Tecnologia 123, Lima',
    "description" TEXT NOT NULL DEFAULT 'Tu tienda de tecnologia de confianza',
    "timezone" TEXT NOT NULL DEFAULT 'america-lima',
    "currency" TEXT NOT NULL DEFAULT 'pen',
    "showOutOfStock" BOOLEAN NOT NULL DEFAULT true,
    "showStockCount" BOOLEAN NOT NULL DEFAULT true,
    "allowReviews" BOOLEAN NOT NULL DEFAULT true,
    "shippingCost" DECIMAL(10,2) NOT NULL DEFAULT 15,
    "freeShippingFrom" DECIMAL(10,2) NOT NULL DEFAULT 200,
    "notifyNewOrders" BOOLEAN NOT NULL DEFAULT true,
    "notifyFailedPayments" BOOLEAN NOT NULL DEFAULT true,
    "notifyLowStock" BOOLEAN NOT NULL DEFAULT true,
    "notifyNewUsers" BOOLEAN NOT NULL DEFAULT false,
    "enableCards" BOOLEAN NOT NULL DEFAULT true,
    "enableTransfer" BOOLEAN NOT NULL DEFAULT true,
    "enableWallets" BOOLEAN NOT NULL DEFAULT true,
    "enableCashOnDelivery" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);
