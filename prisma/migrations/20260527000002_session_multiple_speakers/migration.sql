-- CreateTable
CREATE TABLE "schedule_session_speakers" (
    "session_id" TEXT NOT NULL,
    "speaker_id" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "schedule_session_speakers_pkey" PRIMARY KEY ("session_id","speaker_id")
);

-- Migrate existing single-speaker links
INSERT INTO "schedule_session_speakers" ("session_id", "speaker_id", "display_order")
SELECT "id", "speaker_id", 0
FROM "schedule_sessions"
WHERE "speaker_id" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "schedule_sessions" DROP CONSTRAINT IF EXISTS "schedule_sessions_speaker_id_fkey";

-- AlterTable
ALTER TABLE "schedule_sessions" DROP COLUMN "speaker_id";

-- AddForeignKey
ALTER TABLE "schedule_session_speakers" ADD CONSTRAINT "schedule_session_speakers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "schedule_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_session_speakers" ADD CONSTRAINT "schedule_session_speakers_speaker_id_fkey" FOREIGN KEY ("speaker_id") REFERENCES "speakers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
