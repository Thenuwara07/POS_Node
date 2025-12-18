/*
  Warnings:

  - You are about to drop the `return` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "return" DROP CONSTRAINT "return_item_id_fkey";

-- DropForeignKey
ALTER TABLE "return" DROP CONSTRAINT "return_user_id_fkey";

-- DropTable
DROP TABLE "return";
