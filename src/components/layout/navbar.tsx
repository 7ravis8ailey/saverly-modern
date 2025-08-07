import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { SaverlyLogo } from '@/components/ui/saverly-logo'
import ProfileIcon from '@/components/navigation/ProfileIcon'
import { User, LogOut, Settings, Ticket, Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export function Navbar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && 
          !mobileMenuRef.current.contains(event.target as Node) &&
          !mobileMenuButtonRef.current?.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Trap focus within mobile menu
      const firstFocusableElement = mobileMenuRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      firstFocusableElement?.focus()
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  // Handle escape key to close mobile menu
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
        mobileMenuButtonRef.current?.focus()
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isMobileMenuOpen])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // Define navigation links based on user status
  const getNavigationLinks = () => {
    if (!user) {
      return [
        { to: '/', label: 'Home', ariaLabel: 'Go to home page' },
        { to: '/auth', label: 'Sign In', ariaLabel: 'Sign in to your account' }
      ]
    }

    const baseLinks = [
      { to: '/dashboard', label: 'Dashboard', ariaLabel: 'Go to dashboard' },
      { to: '/coupons', label: 'Browse Coupons', icon: Ticket, ariaLabel: 'Browse available coupons' }
    ]

    if (user.accountType === 'admin') {
      baseLinks.push({ to: '/admin', label: 'Admin', icon: Settings, ariaLabel: 'Access admin panel' })
    }

    return baseLinks
  }

  const navigationLinks = getNavigationLinks()

  return (
    <nav className="bg-white shadow-sm border-b" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center space-x-8">
            <Link 
              to={user ? "/dashboard" : "/"}
              aria-label="Saverly - Go to homepage"
              className="focus:outline-none focus:ring-2 focus:ring-saverly-green focus:ring-offset-2 rounded-lg"
            >
              <SaverlyLogo size="lg" variant="gradient" />
            </Link>
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-4">
              {navigationLinks.slice(0, -1).map((link) => {
                const Icon = 'icon' in link ? link.icon : null
                const isActive = location.pathname === link.to
                
                return (
                  <Link key={link.to} to={link.to}>
                    <Button 
                      variant={isActive ? 'saverly' : 'ghost'} 
                      size="sm"
                      aria-label={link.ariaLabel}
                      aria-current={isActive ? 'page' : undefined}
                      className="focus:outline-none focus:ring-2 focus:ring-saverly-green focus:ring-offset-2"
                    >
                      {Icon && <Icon className="h-4 w-4 mr-2" aria-hidden="true" />}
                      {link.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {user.accountType === 'admin' && (
                  <Link to="/admin">
                    <Button 
                      variant="saverly-outline" 
                      size="sm"
                      aria-label="Access admin panel"
                      className="focus:outline-none focus:ring-2 focus:ring-saverly-green focus:ring-offset-2"
                    >
                      <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                      Admin
                    </Button>
                  </Link>
                )}

                <ProfileIcon showLabel={false} variant="default" />
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/auth">
                  <Button 
                    variant="saverly-outline"
                    size="sm"
                    aria-label="Sign in to your account"
                    className="focus:outline-none focus:ring-2 focus:ring-saverly-green focus:ring-offset-2"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              ref={mobileMenuButtonRef}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-saverly-green transition-colors"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle mobile menu"
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="md:hidden bg-white border-t border-gray-200 shadow-lg"
          id="mobile-menu"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="mobile-menu-button"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationLinks.map((link, index) => {
              const Icon = 'icon' in link ? link.icon : null
              const isActive = location.pathname === link.to
              
              return (
                <Link 
                  key={link.to}
                  to={link.to}
                  onClick={closeMobileMenu}
                  role="menuitem"
                  tabIndex={0}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-saverly-green focus:ring-offset-2 ${
                    isActive 
                      ? 'bg-saverly-green text-white' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  aria-label={link.ariaLabel}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center">
                    {Icon && <Icon className="h-5 w-5 mr-3" aria-hidden="true" />}
                    {link.label}
                  </div>
                </Link>
              )
            })}
            
            {user && (
              <>
                <div className="border-t border-gray-200 pt-4 pb-3">
                  <div className="flex items-center px-3">
                    <div className="flex-shrink-0">
                      <User className="h-8 w-8 text-gray-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">
                        {user.fullName || 'User'}
                      </div>
                      <div className="text-sm font-medium text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Link
                      to="/profile"
                      onClick={closeMobileMenu}
                      role="menuitem"
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-saverly-green focus:ring-offset-2 transition-colors"
                      aria-label="View profile settings"
                    >
                      <div className="flex items-center">
                        <User className="h-5 w-5 mr-3" aria-hidden="true" />
                        Profile
                      </div>
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        closeMobileMenu()
                        signOut()
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-700 hover:text-red-900 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                      aria-label="Sign out of your account"
                    >
                      <div className="flex items-center">
                        <LogOut className="h-5 w-5 mr-3" aria-hidden="true" />
                        Sign Out
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}