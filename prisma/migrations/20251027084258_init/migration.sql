-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'CASHIER', 'STOCKKEEPER');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "SupplierRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'RESENT');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD');

-- CreateEnum
CREATE TYPE "PaymentDiscountType" AS ENUM ('NO', 'PERCENTAGE', 'AMOUNT');

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "color_code" TEXT NOT NULL DEFAULT '#000000',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "refresh_token_hash" TEXT,
    "password_salt" TEXT,
    "password_algo" TEXT,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "brand" TEXT NOT NULL,
    "color_code" TEXT NOT NULL DEFAULT '#000000',
    "location" TEXT NOT NULL,
    "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "preferred" INTEGER NOT NULL DEFAULT 0,
    "payment_terms" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "color_code" TEXT NOT NULL,
    "category_image" TEXT,
    "created_by" INTEGER,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "reorder_level" INTEGER NOT NULL DEFAULT 0,
    "gradient" TEXT,
    "remark" TEXT,
    "color_code" TEXT NOT NULL DEFAULT '#000000',
    "image_path" TEXT,
    "created_by" INTEGER,

    CONSTRAINT "item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock" (
    "id" SERIAL NOT NULL,
    "batch_id" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "sell_price" DOUBLE PRECISION NOT NULL,
    "discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supplier_id" INTEGER NOT NULL,

    CONSTRAINT "stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "remain_amount" DOUBLE PRECISION NOT NULL,
    "date" BIGINT NOT NULL,
    "file_name" TEXT NOT NULL,
    "type" "PaymentMethod" NOT NULL,
    "sale_invoice_id" TEXT,
    "user_id" INTEGER,
    "customer_contact" TEXT,
    "discount_type" "PaymentDiscountType" NOT NULL DEFAULT 'NO',
    "discount_value" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice" (
    "id" SERIAL NOT NULL,
    "batch_id" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_saled_price" DOUBLE PRECISION NOT NULL,
    "sale_invoice_id" TEXT NOT NULL,

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_request" (
    "id" SERIAL NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "status" "SupplierRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "supplier_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_request_item" (
    "id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "requested_amount" INTEGER NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unit_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sale_price" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "supplier_request_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_audit" (
    "id" SERIAL NOT NULL,
    "report_code" TEXT NOT NULL,
    "from_ts" BIGINT NOT NULL,
    "to_ts" BIGINT NOT NULL,
    "query" TEXT,
    "user_id" INTEGER,
    "viewed_at" BIGINT NOT NULL,

    CONSTRAINT "report_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_rule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scope_kind" TEXT NOT NULL,
    "scope_value" TEXT NOT NULL DEFAULT '',
    "value" DOUBLE PRECISION NOT NULL,
    "stackable" INTEGER NOT NULL DEFAULT 1,
    "active" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 10,
    "per_customer_limit" INTEGER,
    "start_time" TEXT,
    "end_time" TEXT,
    "start_date" BIGINT,
    "end_date" BIGINT,
    "days_of_week" TEXT,
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "price_rule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customer_contact_key" ON "customer"("contact");

-- CreateIndex
CREATE INDEX "supplier_created_by_idx" ON "supplier"("created_by");

-- CreateIndex
CREATE INDEX "supplier_updated_by_idx" ON "supplier"("updated_by");

-- CreateIndex
CREATE UNIQUE INDEX "category_category_key" ON "category"("category");

-- CreateIndex
CREATE INDEX "category_created_by_idx" ON "category"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "item_barcode_key" ON "item"("barcode");

-- CreateIndex
CREATE INDEX "item_category_id_idx" ON "item"("category_id");

-- CreateIndex
CREATE INDEX "item_supplier_id_idx" ON "item"("supplier_id");

-- CreateIndex
CREATE INDEX "item_created_by_idx" ON "item"("created_by");

-- CreateIndex
CREATE INDEX "stock_item_id_idx" ON "stock"("item_id");

-- CreateIndex
CREATE INDEX "stock_supplier_id_idx" ON "stock"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_batch_id_item_id_key" ON "stock"("batch_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_sale_invoice_id_key" ON "payment"("sale_invoice_id");

-- CreateIndex
CREATE INDEX "payment_user_id_idx" ON "payment"("user_id");

-- CreateIndex
CREATE INDEX "payment_sale_invoice_id_idx" ON "payment"("sale_invoice_id");

-- CreateIndex
CREATE INDEX "invoice_sale_invoice_id_idx" ON "invoice"("sale_invoice_id");

-- CreateIndex
CREATE INDEX "supplier_request_supplier_id_idx" ON "supplier_request"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_request_item_request_id_idx" ON "supplier_request_item"("request_id");

-- CreateIndex
CREATE INDEX "supplier_request_item_item_id_idx" ON "supplier_request_item"("item_id");

-- CreateIndex
CREATE INDEX "report_audit_report_code_viewed_at_idx" ON "report_audit"("report_code", "viewed_at");

-- CreateIndex
CREATE INDEX "report_audit_user_id_idx" ON "report_audit"("user_id");

-- CreateIndex
CREATE INDEX "price_rule_active_idx" ON "price_rule"("active");

-- CreateIndex
CREATE INDEX "price_rule_priority_idx" ON "price_rule"("priority");

-- CreateIndex
CREATE INDEX "price_rule_created_by_idx" ON "price_rule"("created_by");

-- CreateIndex
CREATE INDEX "price_rule_updated_by_idx" ON "price_rule"("updated_by");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_customer_contact_fkey" FOREIGN KEY ("customer_contact") REFERENCES "customer"("contact") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_sale_invoice_id_fkey" FOREIGN KEY ("sale_invoice_id") REFERENCES "payment"("sale_invoice_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_request" ADD CONSTRAINT "supplier_request_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_request_item" ADD CONSTRAINT "supplier_request_item_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "supplier_request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_request_item" ADD CONSTRAINT "supplier_request_item_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_audit" ADD CONSTRAINT "report_audit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_rule" ADD CONSTRAINT "price_rule_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_rule" ADD CONSTRAINT "price_rule_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
