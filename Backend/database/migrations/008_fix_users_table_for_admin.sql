-- ============================================================
-- PostgreSQL Migration: Fix users table for admin features
-- ============================================================

-- Add missing columns for account management
DO $$
BEGIN
    -- Add suspended_at if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'suspended_at'
    ) THEN
        ALTER TABLE users ADD COLUMN suspended_at TIMESTAMP;
        RAISE NOTICE 'Added suspended_at column';
    END IF;

    -- Add suspended_until if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'suspended_until'
    ) THEN
        ALTER TABLE users ADD COLUMN suspended_until TIMESTAMP;
        RAISE NOTICE 'Added suspended_until column';
    END IF;

    -- Add suspended_by if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'suspended_by'
    ) THEN
        ALTER TABLE users ADD COLUMN suspended_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added suspended_by column';
    END IF;

    -- Ensure account_status column exists with proper check
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'account_status'
    ) THEN
        ALTER TABLE users ADD COLUMN account_status VARCHAR(20) DEFAULT 'active'
            CHECK (account_status IN ('active', 'suspended', 'deleted', 'pending'));
        RAISE NOTICE 'Added account_status column';
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_suspended_by ON users(suspended_by);

-- Migration complete
SELECT 'Migration 008 completed: Users table fixed for admin features' as status;
