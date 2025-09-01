-- Create escrow_transactions table
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  payer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  payee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  commission INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  released_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(booking_id)
);

-- Create transactions table for tracking all point movements
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'escrow_hold', 'escrow_release')),
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create functions for point management
CREATE OR REPLACE FUNCTION add_points(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET points_balance = points_balance + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION deduct_points(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET points_balance = points_balance - amount
  WHERE id = user_id AND points_balance >= amount;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient points balance';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add payment_status to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'held_in_escrow', 'paid', 'refunded'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_booking_id ON escrow_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Enable RLS
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for escrow_transactions
CREATE POLICY "Users can view their own escrow transactions" ON escrow_transactions
  FOR SELECT USING (payer_id = auth.uid() OR payee_id = auth.uid());

-- RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (user_id = auth.uid());
