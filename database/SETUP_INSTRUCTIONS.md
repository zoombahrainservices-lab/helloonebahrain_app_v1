# Cart Database Setup Instructions

## Overview

- **`order_items` table**: Stores items from COMPLETED orders (after checkout)
- **`cart_items` table**: Stores items in user's SHOPPING CART (before checkout)

These are separate tables for different purposes.

---

## Step 1: Create Cart Items Table in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `clmhzxiuzqvebzlkbdjs`
3. Go to **SQL Editor**
4. Copy and paste the entire contents of `database/cart-schema.sql`
5. Click **Run** to execute the SQL

This will create:
- `cart_items` table
- Indexes for performance
- Row Level Security (RLS) policies
- Auto-update triggers

---

## Step 2: Verify Table Creation

1. Go to **Table Editor** in Supabase
2. You should see `cart_items` table
3. Check columns:
   - `id` (UUID)
   - `user_id` (UUID, references auth.users)
   - `product_id` (UUID, references products)
   - `quantity` (INTEGER)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

---

## Step 3: Verify RLS Policies

1. Go to **Authentication** → **Policies**
2. Find `cart_items` table
3. You should see 4 policies:
   - Users can view own cart items
   - Users can insert own cart items
   - Users can update own cart items
   - Users can delete own cart items

---

## Step 4: Test the Setup

The code is already updated:
- ✅ `src/lib/cart-api.ts` - Full CRUD operations
- ✅ `src/contexts/CartContext.tsx` - Uses database API

**How it works:**
- When user is **logged in**: Cart syncs with database (shared across devices)
- When user is **not logged in**: Cart stored locally (AsyncStorage)
- When user **logs in**: Local cart automatically syncs with database

---

## API Functions Available

### `cartApi.getCart(userId)`
Get all cart items for a user

### `cartApi.addItem(userId, productId, quantity)`
Add item to cart (or update quantity if exists)

### `cartApi.updateQuantity(userId, productId, quantity)`
Update item quantity

### `cartApi.removeItem(userId, productId)`
Remove item from cart

### `cartApi.clearCart(userId)`
Clear entire cart

### `cartApi.syncCart(userId, localItems)`
Sync local cart items with server (merges duplicates)

### `cartApi.getItemCount(userId)`
Get total number of items in cart

### `cartApi.getTotal(userId)`
Get total price of all items

---

## Troubleshooting

### Error: "relation cart_items does not exist"
- Run the SQL schema file in Supabase SQL Editor

### Error: "permission denied for table cart_items"
- Check RLS policies are enabled
- Verify user is authenticated

### Cart not syncing between devices
- Ensure user is logged in on both devices
- Check network connection
- Verify backend API is accessible

### Local cart not syncing after login
- Check `CartContext` loads cart on user login
- Verify `cartApi.syncCart()` is called

---

## Database Schema

```sql
cart_items
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key → auth.users)
├── product_id (UUID, Foreign Key → products)
├── quantity (INTEGER)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

Unique Constraint: (user_id, product_id)
```

---

## Next Steps

1. ✅ Run SQL schema in Supabase
2. ✅ Test adding items to cart (logged in)
3. ✅ Test cart sync across devices
4. ✅ Verify cart persists after app restart














