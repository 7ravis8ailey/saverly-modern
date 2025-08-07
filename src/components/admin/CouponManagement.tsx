/**
 * Admin Coupon Management System
 * Complete CRUD interface for managing business coupons
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '../ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar as CalendarIcon,
  Percent,
  DollarSign,
  Users,
  TrendingUp,
  Copy,
  ExternalLink
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { api } from '../../lib/supabase-api';

interface Coupon {
  id: string;
  business_id: string;
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount' | 'buy_one_get_one' | 'free_item';
  discount_value: number;
  discount_text: string;
  minimum_purchase?: number;
  maximum_discount?: number;
  start_date: string;
  end_date: string;
  usage_limit: 'unlimited' | 'once_per_user' | 'limited_total';
  usage_limit_per_user?: number;
  total_usage_limit?: number;
  current_usage_count: number;
  terms_conditions?: string;
  active: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
  redemption_count?: number;
  view_count?: number;
}

interface Business {
  id: string;
  name: string;
  category: string;
}

interface CouponFormData {
  title: string;
  description: string;
  discount_type: Coupon['discount_type'];
  discount_value: number;
  discount_text: string;
  minimum_purchase?: number;
  maximum_discount?: number;
  start_date: Date;
  end_date: Date;
  usage_limit: Coupon['usage_limit'];
  usage_limit_per_user?: number;
  total_usage_limit?: number;
  terms_conditions?: string;
  active: boolean;
  featured: boolean;
}

interface CouponManagementProps {
  business: Business;
  onCouponChange?: () => void;
}

export function CouponManagement({ business, onCouponChange }: CouponManagementProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, [business.id]);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await api.supabase
        .from('coupons')
        .select(`
          *,
          redemptions:redemptions(count)
        `)
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data to include redemption counts
      const processedData = data?.map(coupon => ({
        ...coupon,
        redemption_count: coupon.redemptions?.[0]?.count || 0
      })) || [];

      setCoupons(processedData);
      onCouponChange?.();
    } catch (error) {
      console.error('Failed to load coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await api.supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;

      setCoupons(prev => prev.filter(c => c.id !== couponId));
      onCouponChange?.();
    } catch (error) {
      console.error('Failed to delete coupon:', error);
      alert('Failed to delete coupon. Please try again.');
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const { error } = await api.supabase
        .from('coupons')
        .update({ 
          active: !coupon.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', coupon.id);

      if (error) throw error;

      setCoupons(prev => prev.map(c => 
        c.id === coupon.id ? { ...c, active: !c.active } : c
      ));
      onCouponChange?.();
    } catch (error) {
      console.error('Failed to toggle coupon status:', error);
      alert('Failed to update coupon status. Please try again.');
    }
  };

  const duplicateCoupon = async (coupon: Coupon) => {
    try {
      const duplicateData = {
        business_id: coupon.business_id,
        title: `${coupon.title} (Copy)`,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_text: coupon.discount_text,
        minimum_purchase: coupon.minimum_purchase,
        maximum_discount: coupon.maximum_discount,
        start_date: new Date().toISOString(),
        end_date: addDays(new Date(), 30).toISOString(),
        usage_limit: coupon.usage_limit,
        usage_limit_per_user: coupon.usage_limit_per_user,
        total_usage_limit: coupon.total_usage_limit,
        terms_conditions: coupon.terms_conditions,
        active: false, // Start as inactive
        featured: false
      };

      const { error } = await api.supabase
        .from('coupons')
        .insert([duplicateData]);

      if (error) throw error;

      await loadCoupons();
    } catch (error) {
      console.error('Failed to duplicate coupon:', error);
      alert('Failed to duplicate coupon. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Coupon Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage coupons for {business.name}
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <CouponForm
              business={business}
              onSuccess={() => {
                setShowCreateDialog(false);
                loadCoupons();
              }}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Coupon Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{coupons.length}</div>
                <div className="text-xs text-muted-foreground">Total Coupons</div>
              </div>
              <Percent className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {coupons.filter(c => c.active).length}
                </div>
                <div className="text-xs text-muted-foreground">Active Coupons</div>
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {coupons.reduce((sum, c) => sum + (c.redemption_count || 0), 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Redemptions</div>
              </div>
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {coupons.filter(c => c.featured).length}
                </div>
                <div className="text-xs text-muted-foreground">Featured Coupons</div>
              </div>
              <Eye className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
          <CardDescription>
            Manage all coupons for this business
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading coupons...</div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8">
              <Percent className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No coupons yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first coupon to start attracting customers.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Coupon
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coupon</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{coupon.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {coupon.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {coupon.discount_text}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={coupon.active}
                          onCheckedChange={() => handleToggleActive(coupon)}
                        />
                        {coupon.featured && (
                          <Badge variant="secondary" className="text-xs">
                            Featured
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(coupon.start_date), 'MMM dd')}</div>
                        <div className="text-muted-foreground">
                          to {format(new Date(coupon.end_date), 'MMM dd')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {coupon.redemption_count || 0} redeemed
                        </div>
                        {coupon.usage_limit === 'limited_total' && (
                          <div className="text-muted-foreground">
                            of {coupon.total_usage_limit} max
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateCoupon(coupon)}
                          title="Duplicate coupon"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCoupon(coupon);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {selectedCoupon && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <CouponForm
              business={business}
              coupon={selectedCoupon}
              onSuccess={() => {
                setShowEditDialog(false);
                setSelectedCoupon(null);
                loadCoupons();
              }}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedCoupon(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface CouponFormProps {
  business: Business;
  coupon?: Coupon;
  onSuccess: () => void;
  onCancel: () => void;
}

function CouponForm({ business, coupon, onSuccess, onCancel }: CouponFormProps) {
  const isEditing = !!coupon;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CouponFormData>({
    title: coupon?.title || '',
    description: coupon?.description || '',
    discount_type: coupon?.discount_type || 'percentage',
    discount_value: coupon?.discount_value || 0,
    discount_text: coupon?.discount_text || '',
    minimum_purchase: coupon?.minimum_purchase,
    maximum_discount: coupon?.maximum_discount,
    start_date: coupon ? new Date(coupon.start_date) : new Date(),
    end_date: coupon ? new Date(coupon.end_date) : addDays(new Date(), 30),
    usage_limit: coupon?.usage_limit || 'unlimited',
    usage_limit_per_user: coupon?.usage_limit_per_user,
    total_usage_limit: coupon?.total_usage_limit,
    terms_conditions: coupon?.terms_conditions || '',
    active: coupon?.active ?? true,
    featured: coupon?.featured ?? false
  });

  // Auto-generate discount text when values change
  useEffect(() => {
    let discountText = '';
    
    switch (formData.discount_type) {
      case 'percentage':
        discountText = `${formData.discount_value}% off`;
        break;
      case 'fixed_amount':
        discountText = `$${formData.discount_value} off`;
        break;
      case 'buy_one_get_one':
        discountText = 'Buy One Get One Free';
        break;
      case 'free_item':
        discountText = 'Free Item';
        break;
    }

    if (formData.minimum_purchase && formData.discount_type !== 'free_item') {
      discountText += ` (min $${formData.minimum_purchase})`;
    }

    setFormData(prev => ({ ...prev, discount_text: discountText }));
  }, [formData.discount_type, formData.discount_value, formData.minimum_purchase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const couponData = {
        business_id: business.id,
        title: formData.title,
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        discount_text: formData.discount_text,
        minimum_purchase: formData.minimum_purchase || null,
        maximum_discount: formData.maximum_discount || null,
        start_date: formData.start_date.toISOString(),
        end_date: formData.end_date.toISOString(),
        usage_limit: formData.usage_limit,
        usage_limit_per_user: formData.usage_limit_per_user || null,
        total_usage_limit: formData.total_usage_limit || null,
        terms_conditions: formData.terms_conditions || null,
        active: formData.active,
        featured: formData.featured,
        updated_at: new Date().toISOString()
      };

      let error;

      if (isEditing) {
        const result = await api.supabase
          .from('coupons')
          .update(couponData)
          .eq('id', coupon.id);
        error = result.error;
      } else {
        const result = await api.supabase
          .from('coupons')
          .insert([{
            ...couponData,
            current_usage_count: 0
          }]);
        error = result.error;
      }

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Failed to save coupon:', error);
      alert('Failed to save coupon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? 'Edit Coupon' : 'Create New Coupon'}
        </DialogTitle>
        <DialogDescription>
          {isEditing 
            ? 'Update the coupon details below.' 
            : `Create a new coupon for ${business.name}.`
          }
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Coupon Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., 20% off all items"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount_type">Discount Type *</Label>
          <Select
            value={formData.discount_type}
            onValueChange={(value: CouponFormData['discount_type']) => 
              setFormData(prev => ({ ...prev, discount_type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage Off</SelectItem>
              <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
              <SelectItem value="buy_one_get_one">Buy One Get One</SelectItem>
              <SelectItem value="free_item">Free Item</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe what this coupon offers..."
          required
        />
      </div>

      {(formData.discount_type === 'percentage' || formData.discount_type === 'fixed_amount') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="discount_value">
              {formData.discount_type === 'percentage' ? 'Percentage' : 'Amount'} *
            </Label>
            <div className="relative">
              {formData.discount_type === 'fixed_amount' && (
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              )}
              <Input
                id="discount_value"
                type="number"
                min="0"
                max={formData.discount_type === 'percentage' ? 100 : undefined}
                value={formData.discount_value}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  discount_value: parseFloat(e.target.value) || 0 
                }))}
                className={formData.discount_type === 'fixed_amount' ? 'pl-10' : ''}
                required
              />
              {formData.discount_type === 'percentage' && (
                <Percent className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minimum_purchase">Min Purchase</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="minimum_purchase"
                type="number"
                min="0"
                step="0.01"
                value={formData.minimum_purchase || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  minimum_purchase: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
                className="pl-10"
                placeholder="0.00"
              />
            </div>
          </div>

          {formData.discount_type === 'percentage' && (
            <div className="space-y-2">
              <Label htmlFor="maximum_discount">Max Discount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="maximum_discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.maximum_discount || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    maximum_discount: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                  className="pl-10"
                  placeholder="No limit"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(formData.start_date, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.start_date}
                onSelect={(date) => date && setFormData(prev => ({ ...prev, start_date: date }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>End Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(formData.end_date, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.end_date}
                onSelect={(date) => date && setFormData(prev => ({ ...prev, end_date: date }))}
                disabled={(date) => date < formData.start_date}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="usage_limit">Usage Limit</Label>
          <Select
            value={formData.usage_limit}
            onValueChange={(value: CouponFormData['usage_limit']) => 
              setFormData(prev => ({ ...prev, usage_limit: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unlimited">Unlimited Usage</SelectItem>
              <SelectItem value="once_per_user">Once Per User</SelectItem>
              <SelectItem value="limited_total">Limited Total Usage</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.usage_limit === 'limited_total' && (
          <div className="space-y-2">
            <Label htmlFor="total_usage_limit">Total Usage Limit</Label>
            <Input
              id="total_usage_limit"
              type="number"
              min="1"
              value={formData.total_usage_limit || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                total_usage_limit: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              placeholder="e.g., 100"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="terms_conditions">Terms & Conditions</Label>
        <Textarea
          id="terms_conditions"
          value={formData.terms_conditions}
          onChange={(e) => setFormData(prev => ({ ...prev, terms_conditions: e.target.value }))}
          placeholder="Optional terms and conditions..."
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={formData.active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
          />
          <Label htmlFor="active">Active</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="featured"
            checked={formData.featured}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
          />
          <Label htmlFor="featured">Featured</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (isEditing ? 'Update Coupon' : 'Create Coupon')}
        </Button>
      </DialogFooter>
    </form>
  );
}