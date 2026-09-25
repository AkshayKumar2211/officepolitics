-- CreateTable
CREATE TABLE "OfficeRoom" (
    "code" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "practice" BOOLEAN NOT NULL DEFAULT false,
    "state" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficeRoom_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "OfficeMember" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "sessionHash" TEXT,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "bot" BOOLEAN NOT NULL DEFAULT false,
    "reputation" INTEGER NOT NULL DEFAULT 0,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" TIMESTAMP(3),

    CONSTRAINT "OfficeMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeAssignment" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "station" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "ownerId" TEXT,
    "reviewerId" TEXT,

    CONSTRAINT "OfficeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeChatMessage" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "round" INTEGER NOT NULL,

    CONSTRAINT "OfficeChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeActivity" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "actorId" TEXT,
    "text" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficeActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfficeRoom_updatedAt_idx" ON "OfficeRoom"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OfficeMember_sessionHash_key" ON "OfficeMember"("sessionHash");

-- CreateIndex
CREATE INDEX "OfficeMember_roomCode_idx" ON "OfficeMember"("roomCode");

-- CreateIndex
CREATE INDEX "OfficeAssignment_roomCode_status_idx" ON "OfficeAssignment"("roomCode", "status");

-- CreateIndex
CREATE INDEX "OfficeChatMessage_roomCode_round_idx" ON "OfficeChatMessage"("roomCode", "round");

-- CreateIndex
CREATE INDEX "OfficeActivity_roomCode_at_idx" ON "OfficeActivity"("roomCode", "at");

-- AddForeignKey
ALTER TABLE "OfficeMember" ADD CONSTRAINT "OfficeMember_roomCode_fkey" FOREIGN KEY ("roomCode") REFERENCES "OfficeRoom"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeAssignment" ADD CONSTRAINT "OfficeAssignment_roomCode_fkey" FOREIGN KEY ("roomCode") REFERENCES "OfficeRoom"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeChatMessage" ADD CONSTRAINT "OfficeChatMessage_roomCode_fkey" FOREIGN KEY ("roomCode") REFERENCES "OfficeRoom"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeActivity" ADD CONSTRAINT "OfficeActivity_roomCode_fkey" FOREIGN KEY ("roomCode") REFERENCES "OfficeRoom"("code") ON DELETE CASCADE ON UPDATE CASCADE;

