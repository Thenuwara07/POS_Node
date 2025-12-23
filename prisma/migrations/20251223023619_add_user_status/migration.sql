-- AlterTable
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "status" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable (safe)
CREATE TABLE IF NOT EXISTS "drawer" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" BIGINT NOT NULL,
    "reason" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "drawer_pkey" PRIMARY KEY ("id")
);

-- (Optional but recommended) drawer index + FK safe blocks
CREATE INDEX IF NOT EXISTS "drawer_user_id_idx" ON "drawer"("user_id");

DO $$
BEGIN
  ALTER TABLE "drawer"
    ADD CONSTRAINT "drawer_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable (safe)
CREATE TABLE IF NOT EXISTS "return" (
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

-- CreateIndex (safe)
CREATE INDEX IF NOT EXISTS "return_item_id_idx" ON "return"("item_id");
CREATE INDEX IF NOT EXISTS "return_sale_invoice_id_idx" ON "return"("sale_invoice_id");
CREATE INDEX IF NOT EXISTS "return_user_id_idx" ON "return"("user_id");

-- AddForeignKey (safe)
DO $$
BEGIN
  ALTER TABLE "return"
    ADD CONSTRAINT "return_item_id_fkey"
    FOREIGN KEY ("item_id") REFERENCES "item"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "return"
    ADD CONSTRAINT "return_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
