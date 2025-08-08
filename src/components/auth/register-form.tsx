import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MandatoryAddressSelect, type PlaceDetails } from '@/components/maps/mandatory-address-select'
import { useMandatoryAddress } from '@/hooks/use-mandatory-address'
import { Loader2, User, Mail, Lock, MapPin, Phone, Eye, EyeOff, AlertCircle, Check } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { RegisterForm } from '@/types'

interface RegisterFormProps {
  onToggleMode: () => void
}

export function RegisterForm({ onToggleMode }: RegisterFormProps) {
  const navigate = useNavigate()
  const { signUp, loading } = useAuth()
  const [formData, setFormData] = useState<RegisterForm>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    accountType: 'subscriber' // Always subscriber by default, no UI selection
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [touched, setTouched] = useState<{[key: string]: boolean}>({})
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' })
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)

  // Focus on name input when component mounts
  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const checkPasswordStrength = (password: string) => {
    let score = 0
    let feedback = ''
    
    if (password.length >= 8) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[a-z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    
    if (password.length < 6) {
      feedback = 'Too short - minimum 6 characters required'
    } else if (score <= 2) {
      feedback = 'Weak - consider adding numbers or symbols'
    } else if (score <= 3) {
      feedback = 'Good - consider adding uppercase letters'
    } else {
      feedback = 'Strong password'
    }
    
    return { score, feedback }
  }

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors }
    
    switch (name) {
      case 'fullName':
        if (!value.trim()) {
          newErrors.fullName = 'Full name is required'
        } else if (value.trim().length < 2) {
          newErrors.fullName = 'Name must be at least 2 characters'
        } else {
          delete newErrors.fullName
        }
        break
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email address is required'
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Please enter a valid email address'
        } else {
          delete newErrors.email
        }
        break
      case 'phone':
        if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
          newErrors.phone = 'Please enter a valid phone number'
        } else {
          delete newErrors.phone
        }
        break
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required'
        } else if (value.length < 6) {
          newErrors.password = 'Password must be at least 6 characters'
        } else {
          delete newErrors.password
          setPasswordStrength(checkPasswordStrength(value))
        }
        
        // Re-validate confirm password if it exists
        if (formData.confirmPassword) {
          if (value !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
          } else {
            delete newErrors.confirmPassword
          }
        }
        break
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Please confirm your password'
        } else if (value !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match'
        } else {
          delete newErrors.confirmPassword
        }
        break
    }
    
    setErrors(newErrors)
    return !newErrors[name]
  }

  const handleFieldChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
    
    if (touched[name] || (name === 'password' && value.length > 0)) {
      validateField(name, value)
    }
  }

  const handleFieldBlur = (name: string) => {
    setTouched({ ...touched, [name]: true })
    validateField(name, formData[name as keyof typeof formData] || '')
  }
  
  // Initialize mandatory address hook
  const {
    address,
    selectedPlace,
    isValid: isAddressValid,
    error: addressError,
    getFormProps
  } = useMandatoryAddress({
    required: true,
    onAddressChange: (place: PlaceDetails | null) => {
      if (place) {
        setFormData(prev => ({
          ...prev,
          address: place.formatted_address,
          city: place.city,
          state: place.state,
          zipCode: place.zipCode
        }))
        console.log('Valid Google address selected:', place)
      } else {
        setFormData(prev => ({
          ...prev,
          address: '',
          city: '',
          state: '',
          zipCode: ''
        }))
      }
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.fullName.trim()) {
      toast({
        title: "Error",
        description: "Full name is required",
        variant: "destructive"
      })
      return
    }

    if (!formData.email.trim()) {
      toast({
        title: "Error",
        description: "Email address is required",
        variant: "destructive"
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters",
        variant: "destructive"
      })
      return
    }

    // Validate mandatory address selection
    if (!isAddressValid || !selectedPlace) {
      toast({
        title: "Address Required",
        description: "Please select a valid address from the Google Maps suggestions.",
        variant: "destructive"
      })
      return
    }

    const { error } = await signUp(formData.email, formData.password, {
      fullName: formData.fullName,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      accountType: formData.accountType
    })

    if (error) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success!",
        description: "Account created successfully. Please check your email to verify your account.",
        variant: "success"
      })
      
      // Redirect to non-subscriber dashboard view after successful registration
      // This ensures users see the basic dashboard without being forced into subscription flow
      setTimeout(() => {
        navigate('/')
      }, 1000) // Give user time to read the success message
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Join Saverly to access exclusive local deals
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field */}
            <div className="space-y-1">
              <label htmlFor="register-name" className="block text-sm font-medium text-gray-900">
                Full Name <span className="text-red-500" aria-label="required">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />
                <Input
                  ref={nameRef}
                  id="register-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleFieldChange('fullName', e.target.value)}
                  onBlur={() => handleFieldBlur('fullName')}
                  className={`pl-10 focus:ring-2 focus:ring-saverly-green focus:border-saverly-green ${
                    errors.fullName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  aria-invalid={errors.fullName ? 'true' : 'false'}
                  aria-describedby={errors.fullName ? 'register-name-error' : 'register-name-help'}
                  required
                />
              </div>
              {errors.fullName && (
                <div id="register-name-error" className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                  <span role="alert">{errors.fullName}</span>
                </div>
              )}
              {!errors.fullName && (
                <div id="register-name-help" className="text-xs text-gray-600 mt-1">
                  Your first and last name
                </div>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label htmlFor="register-email" className="block text-sm font-medium text-gray-900">
                Email Address <span className="text-red-500" aria-label="required">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />
                <Input
                  ref={emailRef}
                  id="register-email"
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
                  aria-describedby={errors.email ? 'register-email-error' : 'register-email-help'}
                  required
                />
              </div>
              {errors.email && (
                <div id="register-email-error" className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                  <span role="alert">{errors.email}</span>
                </div>
              )}
              {!errors.email && (
                <div id="register-email-help" className="text-xs text-gray-600 mt-1">
                  We'll send account verification to this email
                </div>
              )}
            </div>

            {/* Phone Field */}
            <div className="space-y-1">
              <label htmlFor="register-phone" className="block text-sm font-medium text-gray-900">
                Phone Number <span className="text-gray-500">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />
                <Input
                  ref={phoneRef}
                  id="register-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  onBlur={() => handleFieldBlur('phone')}
                  className={`pl-10 focus:ring-2 focus:ring-saverly-green focus:border-saverly-green ${
                    errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  aria-invalid={errors.phone ? 'true' : 'false'}
                  aria-describedby={errors.phone ? 'register-phone-error' : 'register-phone-help'}
                />
              </div>
              {errors.phone && (
                <div id="register-phone-error" className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                  <span role="alert">{errors.phone}</span>
                </div>
              )}
              {!errors.phone && (
                <div id="register-phone-help" className="text-xs text-gray-600 mt-1">
                  For account notifications (optional)
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label htmlFor="register-password" className="block text-sm font-medium text-gray-900">
                Password <span className="text-red-500" aria-label="required">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />
                <Input
                  ref={passwordRef}
                  id="register-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  onBlur={() => handleFieldBlur('password')}
                  className={`pl-10 pr-10 focus:ring-2 focus:ring-saverly-green focus:border-saverly-green ${
                    errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'register-password-error' : 'register-password-strength'}
                  required
                  minLength={6}
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
                <div id="register-password-error" className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                  <span role="alert">{errors.password}</span>
                </div>
              )}
              {!errors.password && formData.password && (
                <div id="register-password-strength" className="mt-1">
                  <div className={`text-xs ${
                    passwordStrength.score <= 2 ? 'text-red-600' : 
                    passwordStrength.score === 3 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    <div className="flex items-center">
                      {passwordStrength.score >= 4 && <Check className="h-3 w-3 mr-1" aria-hidden="true" />}
                      {passwordStrength.feedback}
                    </div>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.score <= 2 ? 'bg-red-500' : 
                        passwordStrength.score === 3 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      aria-label={`Password strength: ${passwordStrength.feedback}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1">
              <label htmlFor="register-confirm-password" className="block text-sm font-medium text-gray-900">
                Confirm Password <span className="text-red-500" aria-label="required">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />
                <Input
                  ref={confirmPasswordRef}
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                  onBlur={() => handleFieldBlur('confirmPassword')}
                  className={`pl-10 pr-10 focus:ring-2 focus:ring-saverly-green focus:border-saverly-green ${
                    errors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 
                    formData.confirmPassword && !errors.confirmPassword ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : ''
                  }`}
                  aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                  aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : 'register-confirm-password-help'}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                  tabIndex={0}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <div id="register-confirm-password-error" className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                  <span role="alert">{errors.confirmPassword}</span>
                </div>
              )}
              {!errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div id="register-confirm-password-success" className="flex items-center mt-1 text-sm text-green-600">
                  <Check className="h-4 w-4 mr-1" aria-hidden="true" />
                  <span>Passwords match</span>
                </div>
              )}
              {!errors.confirmPassword && !formData.confirmPassword && (
                <div id="register-confirm-password-help" className="text-xs text-gray-600 mt-1">
                  Re-enter your password to confirm
                </div>
              )}
            </div>

            {/* Address Information - REQUIRED */}
            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">
                <MapPin className="inline h-4 w-4 mr-1" />
                Address <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Select your address from the suggestions to get the best local deals near you.
              </p>
              
              <MandatoryAddressSelect
                {...getFormProps()}
                placeholder="Start typing your address (3+ characters required)..."
                className={`pl-10 ${addressError ? 'border-red-500' : ''}`}
              />
              
              {/* Show selected address confirmation */}
              {selectedPlace && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center text-sm text-green-800">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>✓ {selectedPlace.formatted_address}</span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Coordinates: {selectedPlace.latitude.toFixed(6)}, {selectedPlace.longitude.toFixed(6)}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-saverly-green hover:bg-saverly-dark-green focus:ring-2 focus:ring-saverly-green focus:ring-offset-2" 
              disabled={loading || Object.keys(errors).length > 0 || !isAddressValid}
              aria-describedby="register-submit-status"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Creating Account...</span>
                  <span className="sr-only">Please wait while we create your account</span>
                </>
              ) : (
                <>
                  Create Saverly Account
                  <span className="sr-only">Create your new Saverly account</span>
                </>
              )}
            </Button>
            
            <div id="register-submit-status" className="sr-only" role="status" aria-live="polite">
              {loading && 'Creating your account, please wait...'}
            </div>

            {/* Terms and Privacy Note */}
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-3">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>

            {/* Toggle to Login */}
            <div className="text-center border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">
                Already have a Saverly account?
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={onToggleMode}
                className="w-full focus:ring-2 focus:ring-saverly-green focus:ring-offset-2"
                aria-label="Switch to sign in form"
              >
                Sign In Instead
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}