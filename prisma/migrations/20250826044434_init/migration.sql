/*
  Warnings:

  - Added the required column `status` to the `SupplierRequestDetails` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."RequestStatus" AS ENUM ('PENDING', 'PURCHASED', 'REJECTED', 'COMPLETED');

-- AlterTable
ALTER TABLE "public"."SupplierRequestDetails" ADD COLUMN     "status" "public"."RequestStatus" NOT NULL;
