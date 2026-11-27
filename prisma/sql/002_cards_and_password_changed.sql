-- Additive: virtual card requests + password "last changed" date.
-- Existing rows are untouched (new column is nullable).
BEGIN;
DO $$ BEGIN
  CREATE TYPE "CardStatus" AS ENUM ('REQUESTED', 'ACTIVE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "virtual_cards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'VISA',
    "status" "CardStatus" NOT NULL DEFAULT 'REQUESTED',
    "frozen" BOOLEAN NOT NULL DEFAULT false,
    "last4" TEXT,
    "expiryMonth" INTEGER,
    "expiryYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "virtual_cards_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "virtual_cards_userId_key" ON "virtual_cards"("userId");
DO $$ BEGIN
  ALTER TABLE "virtual_cards" ADD CONSTRAINT "virtual_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
COMMIT;
