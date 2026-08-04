-- Remove decorative settings fields that had no functional consumer anywhere
-- in the app (verified via full-codebase search before writing this migration):
-- timezone, showOutOfStock, showStockCount, allowReviews, shippingCost,
-- freeShippingFrom, notifyNewOrders, notifyFailedPayments, notifyLowStock,
-- notifyNewUsers, enableCards, enableTransfer, enableWallets, enableCashOnDelivery
ALTER TABLE "store_settings" DROP COLUMN "timezone";
ALTER TABLE "store_settings" DROP COLUMN "showOutOfStock";
ALTER TABLE "store_settings" DROP COLUMN "showStockCount";
ALTER TABLE "store_settings" DROP COLUMN "allowReviews";
ALTER TABLE "store_settings" DROP COLUMN "shippingCost";
ALTER TABLE "store_settings" DROP COLUMN "freeShippingFrom";
ALTER TABLE "store_settings" DROP COLUMN "notifyNewOrders";
ALTER TABLE "store_settings" DROP COLUMN "notifyFailedPayments";
ALTER TABLE "store_settings" DROP COLUMN "notifyLowStock";
ALTER TABLE "store_settings" DROP COLUMN "notifyNewUsers";
ALTER TABLE "store_settings" DROP COLUMN "enableCards";
ALTER TABLE "store_settings" DROP COLUMN "enableTransfer";
ALTER TABLE "store_settings" DROP COLUMN "enableWallets";
ALTER TABLE "store_settings" DROP COLUMN "enableCashOnDelivery";

-- Company logo shown in the storefront header (nullable: no logo uploaded yet)
ALTER TABLE "store_settings" ADD COLUMN "logo" TEXT;

-- Update defaults used only when the singleton row is first created
ALTER TABLE "store_settings" ALTER COLUMN "name" SET DEFAULT 'BasicTechShop';
ALTER TABLE "store_settings" ALTER COLUMN "email" SET DEFAULT 'info@basictechshop.com';
ALTER TABLE "store_settings" ALTER COLUMN "description" SET DEFAULT 'Tu tienda de tecnología y computación de confianza';

-- Fix the existing singleton row only if it still has the untouched leftover
-- demo values from the original template (no-op if an admin already edited them)
UPDATE "store_settings" SET "name" = 'BasicTechShop'
  WHERE "id" = 'singleton' AND "name" = 'BasicWear';

UPDATE "store_settings" SET "email" = 'info@basictechshop.com'
  WHERE "id" = 'singleton' AND "email" = 'info@basicwear.com';

UPDATE "store_settings" SET "description" = 'Tu tienda de tecnología y computación de confianza'
  WHERE "id" = 'singleton' AND "description" = 'Tu tienda de ropa y accesorios de confianza';
