/*
  Warnings:

  - The primary key for the `price_rule` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `price_rule` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "price_rule" DROP CONSTRAINT "price_rule_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "price_rule_pkey" PRIMARY KEY ("id");
