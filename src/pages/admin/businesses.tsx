import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { adminAPI } from '@/lib/admin-api';
import { 
  Search, 
  Filter,
  Plus,
  Building2,
  Loader2,
  AlertCircle,
  MapPin,
  Mail,
  Phone,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function AdminBusinesses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'verified' | 'unverified'>('all');
  const navigate = useNavigate();

  const { 
    data: businesses = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['admin', 'businesses'],
    queryFn: () => adminAPI.getBusinesses(100, 0), // Get first 100 businesses
  });

  // Filter businesses based on search and filters
  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = searchQuery === '' || 
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'active' && business.is_active) ||
      (filterStatus === 'verified' && business.is_verified) ||
      (filterStatus === 'unverified' && !business.is_verified);

    return matchesSearch && matchesFilter;
  });

  const getCategoryBadge = (category: string) => {
    const colorMap: Record<string, string> = {
      'Food & Beverage': 'bg-orange-100 text-orange-800',
      'Retail': 'bg-blue-100 text-blue-800',
      'Health & Wellness': 'bg-green-100 text-green-800',
      'Entertainment & Recreation': 'bg-purple-100 text-purple-800',
      'Personal Services': 'bg-pink-100 text-pink-800',
      'Automotive': 'bg-gray-100 text-gray-800',
      'Beauty & Spa': 'bg-rose-100 text-rose-800',
      'Professional Services': 'bg-indigo-100 text-indigo-800',
    };

    const colorClass = colorMap[category] || 'bg-gray-100 text-gray-800';
    
    return (
      <Badge className={cn(colorClass, 'hover:bg-current')}>
        {category}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-saverly-green" />
          <span className="ml-2 text-gray-600">Loading businesses...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">Error loading businesses</h2>
          <p className="text-gray-600">Unable to fetch business data.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="w-8 h-8 text-gray-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Businesses</h1>
              <p className="text-gray-600">
                Manage business listings and verifications ({filteredBusinesses.length} businesses)
              </p>
            </div>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Business
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, contact, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex space-x-2">
                {['all', 'active', 'verified', 'unverified'].map((filter) => (
                  <Button
                    key={filter}
                    variant={filterStatus === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus(filter as any)}
                    className="capitalize"
                  >
                    {filter === 'all' ? 'All' : filter}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Businesses Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Business Listings ({filteredBusinesses.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Coupons</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBusinesses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-gray-500">
                        {searchQuery || filterStatus !== 'all' 
                          ? 'No businesses match your search criteria.'
                          : 'No businesses found.'
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBusinesses.map((business) => (
                    <TableRow 
                      key={business.uid} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/admin/businesses/${business.uid}`)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 flex items-center space-x-2">
                            <span>{business.name}</span>
                            {business.is_verified && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {business.description ? 
                              business.description.slice(0, 50) + (business.description.length > 50 ? '...' : '')
                              : 'No description'
                            }
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(business.category)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{business.contact_name}</div>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Mail className="w-3 h-3" />
                            <span>{business.email}</span>
                          </div>
                          {business.phone && (
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Phone className="w-3 h-3" />
                              <span>{business.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start space-x-1 text-sm">
                          <MapPin className="w-3 h-3 text-gray-400 mt-1 flex-shrink-0" />
                          <div>
                            <div>{business.city}, {business.state}</div>
                            <div className="text-gray-500 text-xs">{business.zip_code}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2">
                            {business.is_active ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          {business.is_verified ? (
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                              Verified
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">{business.total_coupons_issued || 0}</div>
                          <div className="text-xs text-gray-500">
                            {business.total_redemptions || 0} redeemed
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {format(new Date(business.created_at), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/businesses/${business.uid}`);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {businesses.filter(b => b.is_active).length}
              </div>
              <p className="text-sm text-gray-600">Active Businesses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {businesses.filter(b => b.is_verified).length}
              </div>
              <p className="text-sm text-gray-600">Verified Businesses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {businesses.reduce((sum, b) => sum + (b.total_coupons_issued || 0), 0)}
              </div>
              <p className="text-sm text-gray-600">Total Coupons</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {businesses.reduce((sum, b) => sum + (b.total_redemptions || 0), 0)}
              </div>
              <p className="text-sm text-gray-600">Total Redemptions</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}