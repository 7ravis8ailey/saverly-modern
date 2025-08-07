/**
 * Profile Icon Component
 * Displays in top right corner for logged-in users
 * Provides access to profile and logout functionality
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, Settings, LogOut, Crown, CreditCard, 
  Bell, HelpCircle, ChevronDown
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useToast } from '@/hooks/use-toast';

interface ProfileIconProps {
  showLabel?: boolean;
  variant?: 'default' | 'minimal';
}

export default function ProfileIcon({ 
  showLabel = false, 
  variant = 'default' 
}: ProfileIconProps) {
  const { user, signOut } = useAuth();
  const { subscriptionStatus } = useSubscriptionStatus();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Sign Out Failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getUserInitials = () => {
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    return user.displayName || user.email?.split('@')[0] || 'User';
  };

  if (variant === 'minimal') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-green-500 text-white">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-2">
            <p className="text-sm font-medium">{getUserDisplayName()}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative flex items-center gap-2 px-3 py-2 h-auto"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-green-500 text-white">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          {showLabel && (
            <>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium">{getUserDisplayName()}</div>
                <div className="text-xs text-gray-500 truncate max-w-[120px]">
                  {user.email}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </>
          )}
          {subscriptionStatus.isActive && (
            <div className="absolute -top-1 -right-1">
              <Badge className="h-5 w-5 p-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full flex items-center justify-center">
                <Crown className="h-2.5 w-2.5" />
              </Badge>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        {/* User Info Header */}
        <div className="px-3 py-3 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">
                  {getUserDisplayName()}
                </p>
                {subscriptionStatus.isActive && (
                  <Badge className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    <Crown className="w-2.5 h-2.5 mr-1" />
                    Pro
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-1">
          <DropdownMenuItem asChild>
            <Link to="/profile" className="cursor-pointer">
              <User className="mr-3 h-4 w-4" />
              <div>
                <div className="text-sm">View Profile</div>
                <div className="text-xs text-gray-500">Manage your account</div>
              </div>
            </Link>
          </DropdownMenuItem>

          {subscriptionStatus.isActive ? (
            <DropdownMenuItem asChild>
              <Link to="/account/billing" className="cursor-pointer">
                <CreditCard className="mr-3 h-4 w-4" />
                <div>
                  <div className="text-sm">Manage Subscription</div>
                  <div className="text-xs text-gray-500">Billing & payments</div>
                </div>
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link to="/upgrade" className="cursor-pointer">
                <Crown className="mr-3 h-4 w-4 text-yellow-500" />
                <div>
                  <div className="text-sm">Upgrade to Premium</div>
                  <div className="text-xs text-gray-500">$4.99/month</div>
                </div>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild>
            <Link to="/settings" className="cursor-pointer">
              <Settings className="mr-3 h-4 w-4" />
              <div>
                <div className="text-sm">Settings</div>
                <div className="text-xs text-gray-500">Preferences & privacy</div>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/notifications" className="cursor-pointer">
              <Bell className="mr-3 h-4 w-4" />
              <div>
                <div className="text-sm">Notifications</div>
                <div className="text-xs text-gray-500">Manage alerts</div>
              </div>
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />

        <div className="py-1">
          <DropdownMenuItem asChild>
            <Link to="/help" className="cursor-pointer">
              <HelpCircle className="mr-3 h-4 w-4" />
              <span className="text-sm">Help & Support</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
            <LogOut className="mr-3 h-4 w-4" />
            <span className="text-sm">Sign Out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}