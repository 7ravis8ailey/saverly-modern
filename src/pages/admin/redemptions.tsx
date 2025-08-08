import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  RefreshCw,
  Loader2,
  AlertCircle,
  Eye,
  Calendar,
  User,
  Building2,
  Ticket,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function AdminRedemptions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'redeemed' | 'expired' | 'cancelled'>('all');
  const navigate = useNavigate();

  const { 
    data: redemptions = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['admin', 'redemptions'],
    queryFn: () => adminAPI.getRedemptions(100, 0), // Get first 100 redemptions
  });

  // Filter redemptions based on search and filters
  const filteredRedemptions = redemptions.filter(redemption => {
    const matchesSearch = searchQuery === '' || 
      redemption.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      redemption.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      redemption.business?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      redemption.coupon?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      redemption.qr_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      redemption.display_code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || redemption.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'redeemed':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Redeemed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      case 'refunded':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <RefreshCw className="w-3 h-3 mr-1" />
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRatingStars = (rating: number | null) => {
    if (!rating) return <span className="text-gray-400 text-sm">No rating</span>;
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={cn(
              "text-sm",
              star <= rating ? "text-yellow-400" : "text-gray-300"
            )}
          >
            ★
          </span>
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-saverly-green" />
          <span className="ml-2 text-gray-600">Loading redemptions...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">Error loading redemptions</h2>
          <p className="text-gray-600">Unable to fetch redemption data.</p>
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
            <RefreshCw className="w-8 h-8 text-gray-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Redemptions</h1>
              <p className="text-gray-600">
                Track coupon redemptions and customer activity ({filteredRedemptions.length} redemptions)
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by user, business, coupon, or QR code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex space-x-2">
                {['all', 'pending', 'redeemed', 'expired', 'cancelled'].map((filter) => (
                  <Button
                    key={filter}
                    variant={filterStatus === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus(filter as any)}
                    className="capitalize"
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redemptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Coupon Redemptions ({filteredRedemptions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Coupon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRedemptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-gray-500">
                        {searchQuery || filterStatus !== 'all' 
                          ? 'No redemptions match your search criteria.'
                          : 'No redemptions found.'
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRedemptions.map((redemption) => (
                    <TableRow 
                      key={redemption.uid} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/admin/redemptions/${redemption.uid}`)}
                    >
                      <TableCell>
                        <div className="font-mono text-sm">
                          <div className="font-medium">{redemption.display_code}</div>
                          <div className="text-gray-500 text-xs">
                            QR: {redemption.qr_code.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-sm">
                              {redemption.user?.full_name || 'Unknown User'}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {redemption.user?.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-sm">
                              {redemption.business?.name}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {redemption.business?.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start space-x-2">
                          <Ticket className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <div className="font-medium text-sm">
                              {redemption.coupon?.title}
                            </div>
                            <div className="text-gray-600 text-xs font-medium">
                              {redemption.coupon?.discount}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {getStatusBadge(redemption.status)}
                          {redemption.redeemed_at && (
                            <div className="text-xs text-gray-500">
                              {format(new Date(redemption.redeemed_at), 'MMM d, h:mm a')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {redemption.transaction_amount && (
                            <div className="text-sm">
                              <span className="text-gray-600">Total: </span>
                              <span className="font-medium">
                                ${redemption.transaction_amount.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {redemption.savings_amount && (
                            <div className="text-sm">
                              <span className="text-gray-600">Saved: </span>
                              <span className="font-medium text-green-600">
                                ${redemption.savings_amount.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {redemption.rating && (
                            <div className="text-xs">
                              {getRatingStars(redemption.rating)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-gray-600">
                            {format(new Date(redemption.created_at), 'MMM d')}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {format(new Date(redemption.created_at), 'h:mm a')}
                          </div>
                          {redemption.expires_at && (
                            <div className="text-red-500 text-xs">
                              Expires {format(new Date(redemption.expires_at), 'MMM d')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/redemptions/${redemption.uid}`);
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {redemptions.filter(r => r.status === 'pending').length}
              </div>
              <p className="text-sm text-gray-600">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {redemptions.filter(r => r.status === 'redeemed').length}
              </div>
              <p className="text-sm text-gray-600">Redeemed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {redemptions.filter(r => r.status === 'expired').length}
              </div>
              <p className="text-sm text-gray-600">Expired</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${redemptions
                  .filter(r => r.savings_amount)
                  .reduce((sum, r) => sum + (r.savings_amount || 0), 0)
                  .toFixed(0)}
              </div>
              <p className="text-sm text-gray-600">Total Savings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {redemptions.filter(r => r.rating).length > 0
                  ? (redemptions
                      .filter(r => r.rating)
                      .reduce((sum, r) => sum + (r.rating || 0), 0) /
                    redemptions.filter(r => r.rating).length).toFixed(1)
                  : '0'}
              </div>
              <p className="text-sm text-gray-600">Avg Rating</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}