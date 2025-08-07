# Supabase Database Setup for Saverly

## Step 1: Apply Database Schema

1. **Go to your Supabase dashboard**: https://supabase.com/dashboard/project/lziayzusujlvhebyagdl
2. **Navigate to**: SQL Editor
3. **Copy and paste the complete schema** from `supabase-schema.sql`
4. **Click "Run"** to execute the schema

## Step 2: Verify Tables Created

After running the schema, you should see these tables in your database:
- `users` - User accounts and profiles
- `businesses` - Business information
- `coupons` - Coupon offers from businesses  
- `redemptions` - User coupon redemptions

## Step 3: Test Connection

The app will automatically connect using these environment variables:
```
VITE_SUPABASE_URL=https://lziayzusujlvhebyagdl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Create Initial Admin User

After the schema is applied, you can:
1. Register through the app with any email
2. Manually update that user in Supabase to be an admin:

```sql
UPDATE users 
SET account_type = 'admin', is_admin = true 
WHERE email = 'your-email@example.com';
```

## Schema Features Included

✅ **Row Level Security (RLS)** - Users can only access their own data
✅ **Performance Indexes** - Optimized for common queries  
✅ **Automatic Timestamps** - created_at/updated_at tracking
✅ **Data Validation** - Enum constraints and required fields
✅ **Foreign Key Relationships** - Proper data integrity