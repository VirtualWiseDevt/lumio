-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "notifiedPreExpiry2Day" TIMESTAMP(3),
ADD COLUMN "notifiedPreExpiry1Day" TIMESTAMP(3),
ADD COLUMN "notifiedPostExpiry" TIMESTAMP(3);
