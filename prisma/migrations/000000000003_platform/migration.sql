-- Platform services: rate-limit event store (sliding window over Cloud SQL — zero extra
-- infrastructure; the RateLimitStore port lets a deployment swap in Redis later).
-- Global infra table: keys are opaque strings (caller composes e.g. "checkout:org_x"),
-- no tenant rows to isolate -> no RLS; the app role gets full DML (it must prune).
CREATE TABLE "RateLimitEvent" (
    "id" BIGSERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RateLimitEvent_key_at_idx" ON "RateLimitEvent"("key", "at");
