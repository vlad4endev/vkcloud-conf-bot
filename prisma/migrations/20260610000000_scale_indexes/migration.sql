-- Scale indexes for quiz status, notification cron, and broadcast queries
CREATE INDEX IF NOT EXISTS "quiz_results_user_id_idx" ON "quiz_results"("user_id");
CREATE INDEX IF NOT EXISTS "notifications_pending_idx" ON "notifications"("is_sent", "scheduled_at");
CREATE INDEX IF NOT EXISTS "users_is_verified_idx" ON "users"("is_verified");
