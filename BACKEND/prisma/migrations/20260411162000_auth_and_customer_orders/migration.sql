ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "email" TEXT,
    ADD COLUMN IF NOT EXISTS "password" TEXT,
    ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "users"
    ALTER COLUMN "role" SET DEFAULT 'customer';

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

ALTER TABLE "orders"
    ADD COLUMN IF NOT EXISTS "userId" INTEGER,
    ADD COLUMN IF NOT EXISTS "items" JSONB,
    ADD COLUMN IF NOT EXISTS "address" JSONB,
    ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "orders_userId_idx" ON "orders"("userId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'orders_userId_fkey'
    ) THEN
        ALTER TABLE "orders"
            ADD CONSTRAINT "orders_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;
