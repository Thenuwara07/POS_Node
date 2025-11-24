-- CreateEnum
CREATE TYPE "AuthAction" AS ENUM ('LOGIN', 'LOGOUT');

-- CreateTable
CREATE TABLE "auth_log" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "email" TEXT,
    "action" "AuthAction" NOT NULL,
    "ts" BIGINT NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "meta" JSONB,

    CONSTRAINT "auth_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_log_user_id_ts_idx" ON "auth_log"("user_id", "ts");

-- AddForeignKey
ALTER TABLE "auth_log" ADD CONSTRAINT "auth_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
