-- AlterTable
ALTER TABLE "quiz_questions" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'Общее';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "quiz_questions_category_idx" ON "quiz_questions"("category");
