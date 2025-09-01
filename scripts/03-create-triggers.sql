-- Function to create wallet for new users
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance_points)
  VALUES (NEW.id, 1000); -- Welcome bonus
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create wallet when user is created
CREATE TRIGGER create_wallet_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_wallet();

-- Function to update user's last seen
CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last seen on message send
CREATE TRIGGER update_last_seen_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_seen();
