-- Cart Items Table
-- This table stores items in user's shopping cart (before checkout)
-- Separate from order_items which stores completed orders

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- References your users table (validated by backend API)
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one cart item per user per product
  UNIQUE(user_id, product_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_cart_items_timestamp
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_items_updated_at();

-- DISABLE RLS since we're using custom JWT auth (not Supabase Auth)
-- Security is handled in the backend API that validates JWT tokens
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated and anon roles
-- The backend API will validate user permissions before allowing operations
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_items TO anon;

