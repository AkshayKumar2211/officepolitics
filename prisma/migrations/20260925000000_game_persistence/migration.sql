CREATE TABLE "OfficePoliticsSnapshot" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OfficePoliticsSnapshot_pkey" PRIMARY KEY ("id")
);
