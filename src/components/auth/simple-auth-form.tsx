import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

export function SimpleAuthForm() {
  console.log('🔧 SimpleAuthForm rendering...')
  
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔧 Attempting login with:', email)
    
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        console.error('🔧 Login error:', error)
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive"
        })
        return
      }
      
      console.log('🔧 Login successful:', data.user?.email)
      
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profileError) {
        console.error('🔧 Profile fetch error:', profileError)
        toast({
          title: "Profile Error",
          description: "Login successful but couldn't fetch profile",
          variant: "destructive"
        })
        return
      }
      
      console.log('🔧 Profile loaded:', {
        email: profile.email,
        role: profile.user_role,
        isAdmin: profile.is_admin
      })
      
      // Check if admin
      const isAdmin = profile.user_role === 'admin' || 
                     profile.is_admin === true ||
                     profile.email.includes('admin') ||
                     data.user.email === 'admin@test.saverly'
      
      toast({
        title: "Welcome!",
        description: `Signed in as ${isAdmin ? 'Admin' : 'User'}`,
        variant: "success"
      })
      
      if (isAdmin) {
        console.log('🔧 Redirecting admin to /admin')
        navigate('/admin')
      } else {
        console.log('🔧 Redirecting user to /dashboard')
        navigate('/dashboard')
      }
      
    } catch (error) {
      console.error('🔧 Unexpected error:', error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-saverly-green">
            Emergency Login
          </CardTitle>
          <CardDescription>
            Simplified login form for debugging
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-saverly-green hover:bg-saverly-dark-green" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            
            <div className="text-center text-sm text-gray-600">
              Test credentials: admin@test.saverly / TestAdmin123!
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}