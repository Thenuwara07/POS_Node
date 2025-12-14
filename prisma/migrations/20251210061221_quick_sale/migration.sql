-- CreateTable
CREATE TABLE "quick_sale" (
    "id" SERIAL NOT NULL,
    "sale_invoice_id" TEXT NOT NULL,
    "user_id" INTEGER,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" DOUBLE PRECISION NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "created_at" BIGINT NOT NULL,

    CONSTRAINT "quick_sale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quick_sale_sale_invoice_id_idx" ON "quick_sale"("sale_invoice_id");

-- CreateIndex
CREATE INDEX "quick_sale_user_id_idx" ON "quick_sale"("user_id");

-- AddForeignKey
ALTER TABLE "quick_sale" ADD CONSTRAINT "quick_sale_sale_invoice_id_fkey" FOREIGN KEY ("sale_invoice_id") REFERENCES "payment"("sale_invoice_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quick_sale" ADD CONSTRAINT "quick_sale_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
