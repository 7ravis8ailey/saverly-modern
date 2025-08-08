import { useState } from 'react'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'

export function AuthForm() {
  console.log('🔐 AuthForm rendering...');
  const [isLogin, setIsLogin] = useState(true)

  const toggleMode = () => setIsLogin(!isLogin)

  console.log('🔐 AuthForm mode:', isLogin ? 'login' : 'register');
  return isLogin ? (
    <LoginForm onToggleMode={toggleMode} />
  ) : (
    <RegisterForm onToggleMode={toggleMode} />
  )
}