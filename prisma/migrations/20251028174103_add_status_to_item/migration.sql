/*
  Warnings:

  - You are about to drop the column `payment_terms` on the `supplier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "item" ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "supplier" DROP COLUMN "payment_terms",
ALTER COLUMN "location" DROP NOT NULL;
