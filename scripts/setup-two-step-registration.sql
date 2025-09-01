-- =====================================================
-- EmekPay Two-Step Registration Database Setup
-- =====================================================

-- This script sets up the necessary database components
-- for the two-step user registration flow.

-- 1. Run the main temp_registrations table setup
\i 07-create-temp-registrations.sql

-- 2. Add any additional columns to existing tables if needed
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_level INTEGER DEFAULT 0;

-- 3. Update RLS policies if necessary
-- (Policies are already defined in 07-create-temp-registrations.sql)

-- 4. Create any additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_kyc_level ON users(kyc_level);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 5. Test the setup
-- Verify tables exist
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename IN ('users', 'temp_registrations', 'wallets', 'skills')
  AND schemaname = 'public'
ORDER BY tablename;

-- Verify RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('users', 'temp_registrations', 'wallets', 'skills')
  AND schemaname = 'public'
ORDER BY tablename;

-- Verify policies exist
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'temp_registrations', 'wallets', 'skills')
ORDER BY tablename, policyname;

echo 'Two-step registration database setup complete!'
echo 'You can now test the registration flow in your app.'
