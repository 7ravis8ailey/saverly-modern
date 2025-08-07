/**
 * Admin Business Management Page
 * Complete interface for managing businesses and their coupons
 */

import React, { useState, useEffect } from 'react';
import { useAuthProvider } from '../../hooks/use-auth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { 
  Search, 
  Plus, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  Filter,
  Download,
  MoreHorizontal
} from 'lucide-react';
import { api } from '../../lib/supabase-api';

interface Business {
  id: string;
  name: string;
  description?: string;
  category: string;
  email: string;
  phone?: string;
  formatted_address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  latitude: number;
  longitude: number;
  owner_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  coupon_count?: number;
  active_coupons?: number;
}

interface BusinessFilters {
  search: string;
  category: string;
  status: 'all' | 'active' | 'inactive';
  city: string;
}

export function BusinessManagementPage() {
  const { profile } = useAuthProvider();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filters, setFilters] = useState<BusinessFilters>({
    search: '',
    category: '',
    status: 'all',
    city: ''
  });

  // Check admin permissions
  useEffect(() => {
    if (!profile?.is_admin) {
      window.location.href = '/';
      return;
    }
    loadBusinesses();
  }, [profile]);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      // Load businesses with coupon counts
      let query = api.supabase
        .from('businesses')
        .select(`
          *,
          coupons:coupons(count),
          active_coupons:coupons!inner(count)
        `)
        .eq('coupons.active', true);

      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.status !== 'all') {
        query = query.eq('active', filters.status === 'active');
      }
      
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data to include coupon counts
      const processedData = data?.map(business => ({
        ...business,
        coupon_count: business.coupons?.[0]?.count || 0,
        active_coupons: business.active_coupons?.[0]?.count || 0
      })) || [];

      setBusinesses(processedData);
    } catch (error) {
      console.error('Failed to load businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reload when filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadBusinesses();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [filters]);

  const handleDeleteBusiness = async (businessId: string) => {
    if (!confirm('Are you sure you want to delete this business? This will also delete all associated coupons.')) {
      return;
    }

    try {
      const { error } = await api.supabase
        .from('businesses')
        .delete()
        .eq('id', businessId);

      if (error) throw error;

      setBusinesses(prev => prev.filter(b => b.id !== businessId));
      if (selectedBusiness?.id === businessId) {
        setSelectedBusiness(null);
      }
    } catch (error) {
      console.error('Failed to delete business:', error);
      alert('Failed to delete business. Please try again.');
    }
  };

  const exportBusinesses = () => {
    const csv = [
      ['Name', 'Category', 'Email', 'Phone', 'City', 'State', 'Active', 'Coupons', 'Created'].join(','),
      ...businesses.map(b => [
        b.name,
        b.category,
        b.email,
        b.phone || '',
        b.city || '',
        b.state || '',
        b.active ? 'Yes' : 'No',
        b.coupon_count || 0,
        new Date(b.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'businesses.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Building2 className="h-8 w-8" />
                Business Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage all businesses and their coupons in the platform
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={exportBusinesses}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Business
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <CreateBusinessDialog 
                    onClose={() => setShowCreateDialog(false)} 
                    onSuccess={() => {
                      setShowCreateDialog(false);
                      loadBusinesses();
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{businesses.length}</div>
                <div className="text-sm text-muted-foreground">Total Businesses</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {businesses.filter(b => b.active).length}
                </div>
                <div className="text-sm text-muted-foreground">Active Businesses</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {businesses.reduce((sum, b) => sum + (b.coupon_count || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Coupons</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {businesses.reduce((sum, b) => sum + (b.active_coupons || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Active Coupons</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Business List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Businesses</CardTitle>
                <CardDescription>
                  All registered businesses in the platform
                </CardDescription>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search businesses..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">All Categories</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Retail">Retail</option>
                    <option value="Health & Wellness">Health & Wellness</option>
                    <option value="Entertainment & Recreation">Entertainment</option>
                    <option value="Personal Services">Personal Services</option>
                  </select>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as BusinessFilters['status'] }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <Input
                    placeholder="Filter by city..."
                    value={filters.city}
                    onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading businesses...</div>
                ) : businesses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No businesses found matching your criteria.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {businesses.map((business) => (
                      <BusinessCard
                        key={business.id}
                        business={business}
                        onSelect={() => setSelectedBusiness(business)}
                        onDelete={() => handleDeleteBusiness(business.id)}
                        isSelected={selectedBusiness?.id === business.id}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Business Detail Panel */}
          <div className="lg:col-span-1">
            {selectedBusiness ? (
              <BusinessDetailPanel
                business={selectedBusiness}
                onUpdate={(updatedBusiness) => {
                  setSelectedBusiness(updatedBusiness);
                  loadBusinesses();
                }}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Select a Business</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a business from the list to view details and manage coupons.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface BusinessCardProps {
  business: Business;
  onSelect: () => void;
  onDelete: () => void;
  isSelected: boolean;
}

function BusinessCard({ business, onSelect, onDelete, isSelected }: BusinessCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{business.name}</h3>
              <Badge variant={business.active ? 'default' : 'secondary'}>
                {business.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {business.category}
                </Badge>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {business.city}, {business.state}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {business.email}
                </span>
                {business.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {business.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-medium">
              {business.active_coupons}/{business.coupon_count} Coupons
            </div>
            <div className="text-xs text-muted-foreground">
              Created {new Date(business.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface BusinessDetailPanelProps {
  business: Business;
  onUpdate: (business: Business) => void;
}

function BusinessDetailPanel({ business, onUpdate }: BusinessDetailPanelProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Business Details
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Business Name</label>
            <p className="text-sm text-muted-foreground">{business.name}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium">Category</label>
            <p className="text-sm text-muted-foreground">{business.category}</p>
          </div>

          <div>
            <label className="text-sm font-medium">Address</label>
            <p className="text-sm text-muted-foreground">{business.formatted_address}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <p className="text-sm text-muted-foreground">{business.email}</p>
            </div>
            {business.phone && (
              <div>
                <label className="text-sm font-medium">Phone</label>
                <p className="text-sm text-muted-foreground">{business.phone}</p>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Status</label>
            <Badge variant={business.active ? 'default' : 'secondary'}>
              {business.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Coupon Management will be added in next component */}
      <Card>
        <CardHeader>
          <CardTitle>Coupon Management</CardTitle>
          <CardDescription>
            Manage coupons for {business.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Coupon
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            {business.coupon_count} total coupons • {business.active_coupons} active
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Create Business Dialog component will be implemented separately
function CreateBusinessDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  return (
    <div>
      <DialogHeader>
        <DialogTitle>Add New Business</DialogTitle>
        <DialogDescription>
          Create a new business account in the system.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
        <p className="text-sm text-muted-foreground">
          Business creation form will be implemented here with Google Maps integration.
        </p>
      </div>
    </div>
  );
}