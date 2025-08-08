import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface LoginFormProps {
  onToggleMode: () => void
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const navigate = useNavigate()
  const { signIn, loading, user } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [touched, setTouched] = useState<{[key: string]: boolean}>({})
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  // Focus on email input when component mounts
  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors }
    
    switch (name) {
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Please enter a valid email address'
        } else {
          delete newErrors.email
        }
        break
      case 'password':
        if (!value.trim()) {
          newErrors.password = 'Password is required'
        } else if (value.length < 6) {
          newErrors.password = 'Password must be at least 6 characters'
        } else {
          delete newErrors.password
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFieldChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
    
    if (touched[name]) {
      validateField(name, value)
    }
  }

  const handleFieldBlur = (name: string) => {
    setTouched({ ...touched, [name]: true })
    validateField(name, formData[name as keyof typeof formData])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    const emailValid = validateField('email', formData.email)
    const passwordValid = validateField('password', formData.password)
    
    setTouched({ email: true, password: true })
    
    if (!emailValid || !passwordValid) {
      // Focus on first error field
      if (!emailValid) {
        emailRef.current?.focus()
      } else if (!passwordValid) {
        passwordRef.current?.focus()
      }
      return
    }
    
    const { error } = await signIn(formData.email, formData.password)
    
    if (error) {
      const errorMessage = error.message?.toLowerCase()
      
      // Provide more specific error messages
      let description = "Please check your email and password and try again."
      if (errorMessage?.includes('email')) {
        description = "No account found with this email address."
      } else if (errorMessage?.includes('password')) {
        description = "The password you entered is incorrect."
      } else if (errorMessage?.includes('confirmed')) {
        description = "Please check your email and verify your account before signing in."
      }
      
      toast({
        title: "Sign In Failed",
        description,
        variant: "destructive"
      })
      
      // Focus on password field for retry
      passwordRef.current?.focus()
      passwordRef.current?.select()
    } else {
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your account",
        variant: "success"
      })
      
      // Redirect to a router component that will handle proper routing
      navigate('/router')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-saverly-green">
            Welcome Back
          </CardTitle>
          <CardDescription>
            Sign in to access your Saverly account and exclusive deals
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Email Field */}
            <div className="space-y-1">
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-900">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />
                <Input
                  ref={emailRef}
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={() => handleFieldBlur('email')}
                  className={`pl-10 focus:ring-2 focus:ring-saverly-green focus:border-saverly-green ${
                    errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                  required
                />
              </div>
              {errors.email && (
                <div id="login-email-error" className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                  <span role="alert">{errors.email}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-900">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />
                <Input
                  ref={passwordRef}
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  onBlur={() => handleFieldBlur('password')}
                  className={`pl-10 pr-10 focus:ring-2 focus:ring-saverly-green focus:border-saverly-green ${
                    errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'login-password-error' : 'login-password-help'}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <div id="login-password-error" className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                  <span role="alert">{errors.password}</span>
                </div>
              )}
              {!errors.password && (
                <div id="login-password-help" className="text-xs text-gray-600 mt-1">
                  Enter the password for your account
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-saverly-green hover:bg-saverly-dark-green focus:ring-2 focus:ring-saverly-green focus:ring-offset-2" 
              disabled={loading || Object.keys(errors).length > 0}
              aria-describedby="login-submit-status"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Signing in...</span>
                  <span className="sr-only">Please wait while we sign you in</span>
                </>
              ) : (
                <>
                  Sign In
                  <span className="sr-only">Sign in to your Saverly account</span>
                </>
              )}
            </Button>
            
            <div id="login-submit-status" className="sr-only" role="status" aria-live="polite">
              {loading && 'Signing you in, please wait...'}
            </div>

            {/* Toggle to Register */}
            <div className="text-center border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">
                Don't have a Saverly account yet?
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={onToggleMode}
                className="w-full focus:ring-2 focus:ring-saverly-green focus:ring-offset-2"
                aria-label="Switch to create account form"
              >
                Create New Account
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}