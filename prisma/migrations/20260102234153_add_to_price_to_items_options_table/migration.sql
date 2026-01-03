/*
  Warnings:

  - Added the required column `to_price` to the `cleaning_item_options` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cleaning_item_options" ADD COLUMN     "to_price" DOUBLE PRECISION NOT NULL;
