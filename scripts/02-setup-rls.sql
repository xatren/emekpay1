-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Skills policies
CREATE POLICY "Anyone can view skills" ON skills FOR SELECT USING (true);
CREATE POLICY "Users can manage own skills" ON skills FOR ALL USING (auth.uid() = user_id);

-- Listings policies
CREATE POLICY "Anyone can view active listings" ON listings FOR SELECT USING (is_active = true);
CREATE POLICY "Users can manage own listings" ON listings FOR ALL USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in their threads" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.id::text = thread_id 
    AND (b.requester_id = auth.uid() OR b.provider_id = auth.uid())
  )
);
CREATE POLICY "Users can send messages in their threads" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.id::text = thread_id 
    AND (b.requester_id = auth.uid() OR b.provider_id = auth.uid())
  )
);

-- Bookings policies
CREATE POLICY "Users can view their bookings" ON bookings FOR SELECT USING (
  auth.uid() = requester_id OR auth.uid() = provider_id
);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update their bookings" ON bookings FOR UPDATE USING (
  auth.uid() = requester_id OR auth.uid() = provider_id
);

-- Wallets policies
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON wallets FOR UPDATE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view their transactions" ON transactions FOR SELECT USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id
);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for their bookings" ON reviews FOR INSERT WITH CHECK (
  auth.uid() = rater_id AND
  EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.id = booking_id 
    AND (b.requester_id = auth.uid() OR b.provider_id = auth.uid())
    AND b.status = 'completed'
  )
);

-- Verifications policies
CREATE POLICY "Users can view own verifications" ON verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own verifications" ON verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
