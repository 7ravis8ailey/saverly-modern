# Role-Based Frontend Architecture for Saverly

## 🎯 **Single Users Table with Role-Based Views**

Now that we've redesigned the backend to use a single users table with roles, here's how your React frontend should handle role-based routing and views:

## 📋 **User Roles & Permissions**

### **Role Types:**
- `consumer` - Regular users who browse and redeem coupons
- `business` - Business owners who create and manage coupons  
- `admin` - Platform administrators
- `super_admin` - Full system access

### **Permission Matrix:**
| Feature | Consumer | Business | Admin | Super Admin |
|---------|----------|----------|-------|-------------|
| Browse Coupons | ✅ | ✅ | ✅ | ✅ |
| Redeem Coupons | ✅ | ✅ | ✅ | ✅ |
| Create Business | ❌ | ✅ | ✅ | ✅ |
| Manage Own Coupons | ❌ | ✅ | ✅ | ✅ |
| View All Businesses | ❌ | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ | ✅ |
| System Settings | ❌ | ❌ | ❌ | ✅ |

## 🛣️ **Frontend Routing Structure**

### **App.tsx - Role-Based Routing**
```tsx
function App() {
  const { user, userProfile } = useAuth();
  
  if (!user) {
    return <AuthPage />;
  }
  
  // Route based on user role
  switch (userProfile?.user_role) {
    case 'consumer':
      return <ConsumerApp user={userProfile} />;
    
    case 'business':
      return <BusinessApp user={userProfile} />;
    
    case 'admin':
    case 'super_admin':
      return <AdminApp user={userProfile} />;
    
    default:
      return <ConsumerApp user={userProfile} />; // Default fallback
  }
}
```

### **Consumer View (Default Users)**
```tsx
function ConsumerApp({ user }) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/coupons" element={<CouponsPage />} />
        <Route path="/coupon/:id" element={<CouponDetailPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/redemptions" element={<MyRedemptionsPage />} />
        <Route path="/favorites" element={<FavoriteCouponsPage />} />
        
        {/* Upgrade path for consumers who want to become business owners */}
        <Route path="/upgrade" element={<UpgradeToBusinessPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### **Business View (Business Owners)**
```tsx
function BusinessApp({ user }) {
  return (
    <BrowserRouter>
      <Routes>
        {/* All consumer features PLUS business management */}
        <Route path="/" element={<BusinessDashboard />} />
        <Route path="/dashboard" element={<BusinessDashboard />} />
        <Route path="/business/profile" element={<BusinessProfilePage />} />
        <Route path="/business/coupons" element={<ManageCouponsPage />} />
        <Route path="/business/analytics" element={<BusinessAnalyticsPage />} />
        <Route path="/business/redemptions" element={<RedemptionHistoryPage />} />
        
        {/* Consumer features still accessible */}
        <Route path="/browse" element={<BrowseCouponsPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        
        {/* Subscription management */}
        <Route path="/subscription" element={<SubscriptionPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### **Admin View (Platform Administration)**
```tsx
function AdminApp({ user }) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<ManageUsersPage />} />
        <Route path="/admin/businesses" element={<ManageBusinessesPage />} />
        <Route path="/admin/coupons" element={<ManageCouponsPage />} />
        <Route path="/admin/analytics" element={<PlatformAnalyticsPage />} />
        <Route path="/admin/reports" element={<ReportsPage />} />
        
        {/* All other features accessible */}
        <Route path="/browse" element={<BrowseCouponsPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## 🎨 **Navigation Components**

### **Role-Based Navigation Bar**
```tsx
function Navbar({ user }) {
  const renderNavItems = () => {
    switch (user.user_role) {
      case 'consumer':
        return (
          <>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/coupons">Browse Coupons</NavLink>
            <NavLink to="/redemptions">My Redemptions</NavLink>
            <NavLink to="/upgrade">Become a Business</NavLink>
          </>
        );
      
      case 'business':
        return (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/business/coupons">My Coupons</NavLink>
            <NavLink to="/browse">Browse</NavLink>
            <NavLink to="/business/analytics">Analytics</NavLink>
          </>
        );
      
      case 'admin':
      case 'super_admin':
        return (
          <>
            <NavLink to="/admin">Admin Dashboard</NavLink>
            <NavLink to="/admin/users">Users</NavLink>
            <NavLink to="/admin/businesses">Businesses</NavLink>
            <NavLink to="/browse">Browse</NavLink>
          </>
        );
    }
  };
  
  return (
    <nav className="navbar">
      <div className="nav-brand">Saverly</div>
      <div className="nav-items">{renderNavItems()}</div>
      <div className="nav-user">
        <span>{user.full_name}</span>
        <span className="user-role-badge">{user.user_role}</span>
      </div>
    </nav>
  );
}
```

## 🔐 **Permission Hooks**

### **usePermissions Hook**
```tsx
function usePermissions() {
  const { userProfile } = useAuth();
  
  const permissions = {
    canCreateBusiness: ['business', 'admin', 'super_admin'].includes(userProfile?.user_role),
    canManageCoupons: ['business', 'admin', 'super_admin'].includes(userProfile?.user_role),
    canViewAnalytics: ['business', 'admin', 'super_admin'].includes(userProfile?.user_role),
    canManageUsers: ['admin', 'super_admin'].includes(userProfile?.user_role),
    canAccessAdmin: ['admin', 'super_admin'].includes(userProfile?.user_role),
    isAdmin: userProfile?.is_admin === true,
    hasBusinessSubscription: userProfile?.subscription_status === 'active'
  };
  
  return permissions;
}
```

### **Protected Route Component**
```tsx
function ProtectedRoute({ children, requiredRole, requiresSubscription = false }) {
  const { userProfile } = useAuth();
  const permissions = usePermissions();
  
  // Check role permission
  if (requiredRole && !permissions[`can${requiredRole}`]) {
    return <UnauthorizedPage />;
  }
  
  // Check subscription for business features
  if (requiresSubscription && !permissions.hasBusinessSubscription) {
    return <SubscriptionRequiredPage />;
  }
  
  return children;
}
```

## 🎯 **Usage Examples**

### **Role-Based Component Rendering**
```tsx
function CouponCard({ coupon }) {
  const permissions = usePermissions();
  
  return (
    <div className="coupon-card">
      <h3>{coupon.title}</h3>
      <p>{coupon.description}</p>
      
      {/* Everyone can see basic info */}
      <div className="coupon-discount">
        {coupon.discount_value}% off
      </div>
      
      {/* Only business owners can edit their own coupons */}
      {permissions.canManageCoupons && coupon.business_owner_id === userProfile.id && (
        <div className="coupon-actions">
          <button onClick={() => editCoupon(coupon.id)}>Edit</button>
          <button onClick={() => deleteCoupon(coupon.id)}>Delete</button>
        </div>
      )}
      
      {/* Only admins can see admin actions */}
      {permissions.canAccessAdmin && (
        <div className="admin-actions">
          <button onClick={() => flagCoupon(coupon.id)}>Flag</button>
          <button onClick={() => reviewCoupon(coupon.id)}>Review</button>
        </div>
      )}
    </div>
  );
}
```

## 🚀 **Benefits of This Architecture**

### ✅ **Advantages:**
1. **Single Source of Truth** - All users in one table
2. **Easy Role Changes** - Update user_role field to change permissions
3. **Subscription Management** - Built-in business subscription handling
4. **Clean Frontend** - Role-based routing and components
5. **Scalable** - Easy to add new roles (e.g., 'moderator', 'partner')
6. **Flexible Permissions** - Granular control over what each role can do

### 🎯 **User Experience:**
- **Consumers** see a clean coupon browsing experience
- **Business owners** get dashboard with coupon management tools
- **Admins** have platform oversight and management tools
- **Seamless upgrades** from consumer to business owner

This architecture gives you maximum flexibility while keeping the code clean and maintainable!