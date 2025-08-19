/*
  Warnings:

  - A unique constraint covering the columns `[barcode]` on the table `Item` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `barcode` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cost` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `markup` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salePrice` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "barcode" TEXT NOT NULL,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "cost" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "gradient" TEXT,
ADD COLUMN     "lowStockWarn" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "markup" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "remark" TEXT,
ADD COLUMN     "reorderLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "salePrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Active',
ADD COLUMN     "unit" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Item_barcode_key" ON "public"."Item"("barcode");
