-- CreateEnum
CREATE TYPE "SessionTrack" AS ENUM ('all', 'tech', 'business');

-- AlterTable
ALTER TABLE "schedule_sessions" ADD COLUMN "track" "SessionTrack" NOT NULL DEFAULT 'all';
