-- AlterTable
ALTER TABLE "Content" ADD COLUMN "transcodingStatus" TEXT,
ADD COLUMN "transcodingError" TEXT,
ADD COLUMN "sourceVideoKey" TEXT,
ADD COLUMN "hlsKey" TEXT;

-- AlterTable
ALTER TABLE "Episode" ADD COLUMN "transcodingStatus" TEXT,
ADD COLUMN "transcodingError" TEXT,
ADD COLUMN "sourceVideoKey" TEXT,
ADD COLUMN "hlsKey" TEXT;
