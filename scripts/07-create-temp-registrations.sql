-- Temporary registrations table for two-step registration flow
CREATE TABLE temp_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  step INTEGER DEFAULT 1 CHECK (step IN (1, 2)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE temp_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own temp registration" ON temp_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own temp registration" ON temp_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own temp registration" ON temp_registrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own temp registration" ON temp_registrations FOR DELETE USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX idx_temp_registrations_user_id ON temp_registrations(user_id);
CREATE INDEX idx_temp_registrations_email ON temp_registrations(email);

-- Function to clean up old temporary registrations (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_temp_registrations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM temp_registrations
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_temp_registration_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_temp_registration_updated_at
  BEFORE UPDATE ON temp_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_temp_registration_updated_at();
