/*
  Warnings:

  - You are about to drop the column `cost` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `lowStockWarn` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `markup` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `salePrice` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `Item` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Item" DROP COLUMN "cost",
DROP COLUMN "lowStockWarn",
DROP COLUMN "markup",
DROP COLUMN "salePrice",
DROP COLUMN "status",
DROP COLUMN "unit";
