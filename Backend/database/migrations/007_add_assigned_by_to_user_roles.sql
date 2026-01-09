-- ============================================================
-- PostgreSQL Migration: Add assigned_by to user_roles
-- ============================================================

-- Add assigned_by column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_roles'
        AND column_name = 'assigned_by'
    ) THEN
        ALTER TABLE user_roles
        ADD COLUMN assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

        RAISE NOTICE 'Added assigned_by column to user_roles';
    ELSE
        RAISE NOTICE 'Column assigned_by already exists in user_roles';
    END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON user_roles(assigned_by);

-- Migration complete
SELECT 'Migration 007 completed: assigned_by column added to user_roles' as status;
