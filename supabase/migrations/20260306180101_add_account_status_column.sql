/*
  # Add account_status column to users table

  1. Modified Tables
    - `users`
      - `account_status` (text, default 'active') - Tracks whether a user account is active or suspended

  2. Security
    - Add RLS policy for authenticated users to read their own account status
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'account_status'
  ) THEN
    ALTER TABLE users ADD COLUMN account_status text NOT NULL DEFAULT 'active';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'Users can read own account status'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can read own account status" ON users FOR SELECT TO authenticated USING (auth.uid() = id)';
  END IF;
END $$;