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

export function Login() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { setUser } = useAppStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await authApi.login({ username, password })

      if (response.data.code === 0 && response.data.data) {
        const { token, user } = response.data.data

        console.log('Login successful:', { token, user })

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

        console.log('User stored, navigating to home...')

        // Show success message
        toast.success(`${t.auth.loginTitle}, ${user.username}!`)

        // Navigate to home using window.location for full page reload
        // This ensures zustand persist middleware properly rehydrates the state
        console.log('Executing navigation')
        window.location.href = '/'
      } else {
        setError(response.data.message || t.auth.loginError)
      }
    } catch (err: unknown) {
      console.error('Login error:', err)
      const error = err as { response?: { status?: number; data?: { message?: string } } }

      // Handle different error scenarios
      if (error.response?.status === 401) {
        setError(t.auth.loginError)
      } else if (error.response?.status === 403) {
        setError(t.auth.userNotActive)
      } else if (error.response?.data?.message) {
        setError(error.response.data.message)
      } else {
        setError(t.auth.loginError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Skip login for development (temporary)
  const handleSkipLogin = () => {
    console.log('Skip login - setting dev credentials')

    localStorage.setItem('token', 'dev-token')
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      username: 'dev-user',
      email: 'dev@example.com',
      is_active: true
    }))

    // Update user in store
    setUser({
      id: '1',
      name: 'dev-user',
      email: 'dev@example.com',
    })

    console.log('Dev user stored, navigating...')

    toast.success('Development mode: Login skipped')

    // Navigate to home using window.location for full page reload
    window.location.href = '/'
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
          <CardTitle className="text-2xl text-center">{t.auth.loginTitle}</CardTitle>
          <CardDescription className="text-center">
            {t.auth.loginDescription}
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
                disabled={isLoading}
                autoComplete="username"
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
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? t.auth.loggingIn : t.auth.loginButton}
            </Button>

            {/* Development mode: Skip login button */}
            {import.meta.env.DEV && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleSkipLogin}
              >
                {t.auth.skipLogin}
              </Button>
            )}
          </form>

          {/* Register link */}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {t.auth.noAccount}{' '}
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={() => navigate('/register')}
            >
              {t.auth.signUp}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
