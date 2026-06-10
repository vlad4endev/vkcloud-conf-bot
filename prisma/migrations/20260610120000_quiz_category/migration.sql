ALTER TABLE "quiz_questions" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Общее';

CREATE INDEX "quiz_questions_category_idx" ON "quiz_questions"("category");
