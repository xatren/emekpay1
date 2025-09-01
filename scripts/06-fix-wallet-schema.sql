-- Update the database schema to match the wallet system requirements

-- Add points_balance column to profiles table for compatibility
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points_balance INTEGER DEFAULT 1000;

-- Update existing profiles to have initial balance if they don't have wallets
UPDATE profiles 
SET points_balance = 1000 
WHERE points_balance IS NULL;

-- Create or update wallet records for existing users
INSERT INTO wallets (user_id, balance_points)
SELECT id, COALESCE(points_balance, 1000)
FROM profiles
WHERE id NOT IN (SELECT user_id FROM wallets)
ON CONFLICT (user_id) DO NOTHING;

-- Sync points_balance with wallets table
UPDATE profiles 
SET points_balance = wallets.balance_points
FROM wallets 
WHERE profiles.id = wallets.user_id;

-- Create function to keep profiles and wallets in sync
CREATE OR REPLACE FUNCTION sync_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profiles table when wallets table changes
  UPDATE profiles 
  SET points_balance = NEW.balance_points 
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync wallet changes
DROP TRIGGER IF EXISTS sync_wallet_balance_trigger ON wallets;
CREATE TRIGGER sync_wallet_balance_trigger
  AFTER UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION sync_wallet_balance();

-- Update transaction types to match the UI expectations
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('hold', 'release', 'refund', 'adjust', 'credit', 'debit', 'escrow_hold', 'escrow_release'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_user ON transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_user ON transactions(to_user_id);
