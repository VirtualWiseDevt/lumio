-- CreateTable
CREATE TABLE "BrowseRow" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "contentIds" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrowseRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrowseRow_slug_key" ON "BrowseRow"("slug");

-- CreateIndex
CREATE INDEX "BrowseRow_position_idx" ON "BrowseRow"("position");

-- CreateIndex
CREATE INDEX "BrowseRow_isActive_idx" ON "BrowseRow"("isActive");
