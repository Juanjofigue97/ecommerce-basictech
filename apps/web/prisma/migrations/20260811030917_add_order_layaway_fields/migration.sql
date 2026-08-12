-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'LAYAWAY';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliverNow" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "holdDays" INTEGER,
ADD COLUMN     "holdUntil" TIMESTAMP(3);
