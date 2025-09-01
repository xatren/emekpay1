-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  city TEXT,
  district TEXT,
  bio TEXT,
  avatar_url TEXT,
  kyc_level INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills table
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'expert')) DEFAULT 'beginner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Listings table
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('offer', 'request')) NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  hourly_point_rate INTEGER NOT NULL,
  city TEXT,
  district TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'canceled')) DEFAULT 'pending',
  total_points INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallets table
CREATE TABLE wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance_points INTEGER DEFAULT 1000, -- Initial bonus points
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  booking_id UUID REFERENCES bookings(id),
  points INTEGER NOT NULL,
  fee_points INTEGER DEFAULT 0,
  type TEXT CHECK (type IN ('hold', 'release', 'refund', 'adjust')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  rater_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ratee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verifications table
CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('email', 'phone', 'id')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_bookings_requester_id ON bookings(requester_id);
CREATE INDEX idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX idx_transactions_user_ids ON transactions(from_user_id, to_user_id);
