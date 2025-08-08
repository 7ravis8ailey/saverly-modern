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
  Users,
  Loader2,
  AlertCircle,
  Crown,
  User,
  Building2,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive' | 'admin'>('all');
  const navigate = useNavigate();

  const { 
    data: users = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminAPI.getUsers(100, 0), // Get first 100 users
  });

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;

    const matchesFilter = filterType === 'all' ||
      (filterType === 'active' && user.subscription_status === 'active') ||
      (filterType === 'inactive' && (user.subscription_status === 'free' || user.subscription_status === 'cancelled')) ||
      (filterType === 'admin' && (user.user_role === 'admin' || user.is_admin === true));

    return matchesSearch && matchesFilter;
  });

  const getAccountTypeIcon = (user: any) => {
    if (user.user_role === 'admin' || user.is_admin) {
      return <Crown className="w-4 h-4 text-yellow-600" />;
    } else if (user.user_role === 'business') {
      return <Building2 className="w-4 h-4 text-purple-600" />;
    } else {
      return <User className="w-4 h-4 text-blue-600" />;
    }
  };

  const getSubscriptionBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
      case 'past_due':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Past Due</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-saverly-green" />
          <span className="ml-2 text-gray-600">Loading users...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">Error loading users</h2>
          <p className="text-gray-600">Unable to fetch user data.</p>
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
            <Users className="w-8 h-8 text-gray-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Users</h1>
              <p className="text-gray-600">
                Manage user accounts and subscriptions ({filteredUsers.length} users)
              </p>
            </div>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex space-x-2">
                {['all', 'active', 'inactive', 'admin'].map((filter) => (
                  <Button
                    key={filter}
                    variant={filterType === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType(filter as any)}
                    className="capitalize"
                  >
                    {filter === 'all' ? 'All Users' : filter}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              User Accounts ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-gray-500">
                        {searchQuery || filterType !== 'all' 
                          ? 'No users match your search criteria.'
                          : 'No users found.'
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow 
                      key={user.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/admin/users/${user.id}`)}
                    >
                      <TableCell>
                        {getAccountTypeIcon(user)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.full_name || 'No name provided'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="text-sm text-gray-500">
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getAccountTypeIcon(user)}
                          <span className="capitalize text-sm">
                            {user.user_role || 'consumer'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSubscriptionBadge(user.subscription_status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.city && user.state ? (
                            <div>{user.city}, {user.state}</div>
                          ) : user.address ? (
                            <div className="text-gray-500">Address provided</div>
                          ) : (
                            <div className="text-gray-400">No location</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/users/${user.id}`);
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
              <div className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.user_role === 'consumer' || (!u.user_role && !u.is_admin)).length}
              </div>
              <p className="text-sm text-gray-600">Consumers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.subscription_status === 'active').length}
              </div>
              <p className="text-sm text-gray-600">Active Subscriptions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.user_role === 'business').length}
              </div>
              <p className="text-sm text-gray-600">Business Accounts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {users.filter(u => u.user_role === 'admin' || u.is_admin === true).length}
              </div>
              <p className="text-sm text-gray-600">Admin Accounts</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}