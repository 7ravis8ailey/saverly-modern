#!/bin/bash

# Fix all incorrect useAuth imports
echo "Fixing useAuth imports..."

# List of files that need the import fixed
files=(
  "src/components/payment/manage-subscription.tsx"
  "src/components/payment/subscription-dialog.tsx"
  "src/components/admin/admin-layout.tsx"
  "src/components/payment/payment-form.tsx"
  "src/pages/home.tsx"
  "src/pages/coupons.tsx"
  "src/components/layout/navbar.tsx"
  "src/components/auth/login-form.tsx"
  "src/components/auth/register-form.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    sed -i '' "s|import { useAuth } from '@/hooks/use-auth'|import { useAuth } from '@/components/auth/auth-provider'|g" "$file"
  fi
done

echo "All imports fixed!"