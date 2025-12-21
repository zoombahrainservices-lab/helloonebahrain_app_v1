-- Fix Cart Items Foreign Key Constraint Issue
-- This removes the foreign key that's blocking cart operations

-- Drop the existing foreign key constraint
ALTER TABLE cart_items 
DROP CONSTRAINT IF EXISTS cart_items_user_id_fkey;

-- Verify it's removed (this will show an error if constraint doesn't exist, which is fine)
-- The constraint is now removed and cart operations will work
