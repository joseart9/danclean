-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'DELIVERED';
ALTER TYPE "OrderStatus" ADD VALUE 'PICKED_UP';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "storage_id" TEXT;

-- CreateTable
CREATE TABLE "storages" (
    "id" TEXT NOT NULL,
    "storage_number" INTEGER NOT NULL,
    "total_capacity" INTEGER NOT NULL,
    "used_capacity" INTEGER NOT NULL DEFAULT 0,
    "from_number_range" INTEGER NOT NULL,
    "to_number_range" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active_order_numbers" (
    "id" TEXT NOT NULL,
    "order_number" INTEGER NOT NULL,
    "order_id" TEXT NOT NULL,
    "storage_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "active_order_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "storages_storage_number_key" ON "storages"("storage_number");

-- CreateIndex
CREATE UNIQUE INDEX "active_order_numbers_order_number_key" ON "active_order_numbers"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "active_order_numbers_order_id_key" ON "active_order_numbers"("order_id");

-- AddForeignKey
ALTER TABLE "active_order_numbers" ADD CONSTRAINT "active_order_numbers_storage_id_fkey" FOREIGN KEY ("storage_id") REFERENCES "storages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_storage_id_fkey" FOREIGN KEY ("storage_id") REFERENCES "storages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
