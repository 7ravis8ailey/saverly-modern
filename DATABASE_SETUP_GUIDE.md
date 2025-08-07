# Saverly Database Setup Guide

## 🚀 Complete Database Setup Instructions

### Status: ✅ Connection Verified | ⏳ Schema Pending | 👥 Test Users Created

---

## Step 1: Apply Database Schema

Since the MCP Supabase tools are not available and the JavaScript client cannot execute DDL statements, you need to apply the database schema manually using the Supabase Dashboard.

### Method 1: Supabase Dashboard SQL Editor (Recommended)

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/lziayzusujlvhebyagdl/sql
   - Login with your Supabase account

2. **Execute the Schema**
   - Copy the entire contents of `/supabase-schema.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute all statements

3. **Verify Success**
   - Check that all tables are created: `users`, `businesses`, `coupons`, `redemptions`
   - Verify Row Level Security is enabled
   - Confirm indexes are created

### Method 2: Command Line (Alternative)

If you have PostgreSQL client installed:

```bash
# Install psql (if not already installed)
brew install postgresql  # macOS
sudo apt install postgresql-client  # Ubuntu

# Apply schema (you'll need the database password)
psql "postgresql://postgres:[PASSWORD]@db.lziayzusujlvhebyagdl.supabase.co:5432/postgres" -f supabase-schema.sql
```

---

## Step 2: Create Sample Data

After the schema is applied, run the sample data script:

```bash
node create-sample-data.js
```

This will:
- ✅ Verify all tables exist
- 👥 Sync user profiles with auth users
- 🏢 Create 5 sample businesses
- 🎫 Create sample coupons for each business
- 📊 Display database summary

---

## Database Schema Overview

### Tables Created

| Table | Purpose | Records | Security |
|-------|---------|---------|----------|
| **users** | User profiles & subscription data | Links to auth.users | RLS enabled |
| **businesses** | Business listings | Public readable | Admin-only write |
| **coupons** | Offers and deals | Public active coupons | Admin-only manage |
| **redemptions** | Usage tracking | User's own only | RLS enforced |

### Key Features

- 🔐 **Row Level Security (RLS)** on all tables
- 🚀 **Performance indexes** on frequently queried columns
- ⚡ **Auto-updating timestamps** with triggers
- 🎯 **Referential integrity** with foreign keys
- 📍 **Geolocation support** for businesses and users

---

## Test Users Available

| Role | Email | Password | Access |
|------|-------|----------|---------|
| **Admin** | admin@saverly.test | adminpass123 | Full system access |
| **User** | user@saverly.test | userpass123 | Standard user features |

---

## Verification Steps

After setup, verify the database is working:

### 1. Check Tables
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'businesses', 'coupons', 'redemptions');
```

### 2. Check RLS Status
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'businesses', 'coupons', 'redemptions');
```

### 3. Check Sample Data
```sql
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM businesses) as businesses,
  (SELECT COUNT(*) FROM coupons) as coupons,
  (SELECT COUNT(*) FROM redemptions) as redemptions;
```

---

## Next Steps

1. ✅ **Apply schema** using Supabase Dashboard
2. ✅ **Run sample data script**: `node create-sample-data.js`
3. ✅ **Test application** with created users
4. ✅ **Verify features**: registration, login, coupon viewing
5. ✅ **Admin testing**: business management, coupon creation

---

## Troubleshooting

### Common Issues

**"relation does not exist" errors**
- ❌ Schema not applied yet
- ✅ Use Supabase Dashboard SQL Editor

**"permission denied" errors**
- ❌ RLS policies not created
- ✅ Ensure complete schema execution

**Connection issues**
- ❌ Environment variables incorrect
- ✅ Check `.env` file configuration

### Support Files

- `test-supabase-connection.js` - Test basic connectivity
- `setup-schema-supabase.js` - Verify setup and create users
- `create-sample-data.js` - Add test data after schema
- `supabase-schema.sql` - Complete database schema

---

## Database Ready Checklist

- [ ] Supabase connection tested ✅
- [ ] Schema applied via Dashboard
- [ ] Sample data created
- [ ] Test users can login
- [ ] Admin functions accessible
- [ ] RLS policies working
- [ ] Application features tested

**Status**: Ready for development and testing! 🎉