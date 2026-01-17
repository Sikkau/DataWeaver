import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useI18n } from '@/i18n/I18nContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { authApi } from '@/api/auth'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/useAppStore'

export function Register() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { setUser } = useAppStore()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await authApi.register({ username, email, password })

      if (response.data.code === 0 && response.data.data) {
        const { token, user } = response.data.data

        console.log('Registration successful:', { token, user })

        // Store token in localStorage
        localStorage.setItem('token', token)

        // Store user info
        localStorage.setItem('user', JSON.stringify(user))

        // Update user in store
        setUser({
          id: String(user.id),
          name: user.username,
          email: user.email,
        })

        console.log('User stored, navigating...')

        // Show success message
        toast.success(t.auth.registerSuccess)

        // Navigate to home using window.location for full page reload
        // This ensures zustand persist middleware properly rehydrates the state
        window.location.href = '/'
      } else {
        setError(response.data.message || t.auth.registerError)
      }
    } catch (err: unknown) {
      console.error('Register error:', err)
      const error = err as { response?: { status?: number; data?: { message?: string } } }

      // Handle different error scenarios
      if (error.response?.status === 409) {
        setError(t.auth.userExists)
      } else if (error.response?.data?.message) {
        setError(error.response.data.message)
      } else {
        setError(t.auth.registerError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-2xl font-bold text-primary">DataWeaver</h1>
          </div>
          <CardTitle className="text-2xl text-center">{t.auth.registerTitle}</CardTitle>
          <CardDescription className="text-center">
            {t.auth.registerDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                {t.auth.username}
              </label>
              <Input
                id="username"
                type="text"
                placeholder={t.auth.usernamePlaceholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t.auth.email}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t.auth.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={100}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {t.auth.password}
              </label>
              <Input
                id="password"
                type="password"
                placeholder={t.auth.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                maxLength={100}
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? t.auth.registering : t.auth.registerButton}
            </Button>
          </form>

          {/* Login link */}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {t.auth.haveAccount}{' '}
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={() => navigate('/login')}
            >
              {t.auth.signIn}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
