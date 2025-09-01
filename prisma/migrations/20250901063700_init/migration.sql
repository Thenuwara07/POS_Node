-- CreateEnum
CREATE TYPE "public"."CreditEntryType" AS ENUM ('INVOICE', 'SETTLEMENT');

-- CreateTable
CREATE TABLE "public"."Creditor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Creditor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CreditEntry" (
    "id" SERIAL NOT NULL,
    "entryType" "public"."CreditEntryType" NOT NULL,
    "refNo" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creditorId" INTEGER NOT NULL,
    "paymentId" INTEGER,

    CONSTRAINT "CreditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Creditor_phone_key" ON "public"."Creditor"("phone");

-- CreateIndex
CREATE INDEX "CreditEntry_creditorId_idx" ON "public"."CreditEntry"("creditorId");

-- CreateIndex
CREATE INDEX "CreditEntry_paymentId_idx" ON "public"."CreditEntry"("paymentId");

-- AddForeignKey
ALTER TABLE "public"."CreditEntry" ADD CONSTRAINT "CreditEntry_creditorId_fkey" FOREIGN KEY ("creditorId") REFERENCES "public"."Creditor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreditEntry" ADD CONSTRAINT "CreditEntry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
