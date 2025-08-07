import { useState } from 'react'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)

  const toggleMode = () => setIsLogin(!isLogin)

  return isLogin ? (
    <LoginForm onToggleMode={toggleMode} />
  ) : (
    <RegisterForm onToggleMode={toggleMode} />
  )
}