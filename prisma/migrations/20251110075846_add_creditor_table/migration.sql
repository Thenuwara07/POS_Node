-- CreateTable
CREATE TABLE "creditor" (
    "id" SERIAL NOT NULL,
    "customer_contact" TEXT NOT NULL,
    "total_due" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "last_payment_at" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "creditor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "creditor_customer_contact_idx" ON "creditor"("customer_contact");

-- CreateIndex
CREATE INDEX "creditor_created_by_idx" ON "creditor"("created_by");

-- CreateIndex
CREATE INDEX "creditor_updated_by_idx" ON "creditor"("updated_by");

-- AddForeignKey
ALTER TABLE "creditor" ADD CONSTRAINT "creditor_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditor" ADD CONSTRAINT "creditor_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditor" ADD CONSTRAINT "creditor_customer_contact_fkey" FOREIGN KEY ("customer_contact") REFERENCES "customer"("contact") ON DELETE RESTRICT ON UPDATE CASCADE;
