/*
  Warnings:

  - You are about to drop the column `stripeSessionId` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "stripeSessionId",
ADD COLUMN     "paymentSessionId" TEXT;
