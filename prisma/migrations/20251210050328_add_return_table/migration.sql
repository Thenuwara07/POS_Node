-- CreateTable
CREATE TABLE "return" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "batch_id" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_saled_price" DOUBLE PRECISION NOT NULL,
    "sale_invoice_id" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL,
    "is_done" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "return_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "return_item_id_idx" ON "return"("item_id");

-- CreateIndex
CREATE INDEX "return_sale_invoice_id_idx" ON "return"("sale_invoice_id");

-- CreateIndex
CREATE INDEX "return_user_id_idx" ON "return"("user_id");

-- AddForeignKey
ALTER TABLE "return" ADD CONSTRAINT "return_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return" ADD CONSTRAINT "return_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
