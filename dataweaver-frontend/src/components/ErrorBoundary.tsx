import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom'
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { translations } from '@/i18n/translations'
import type { Language } from '@/i18n/translations'

// Get translations based on stored language preference
function useErrorTranslations() {
  const storedLang = localStorage.getItem('dataweaver-language') as Language | null
  const browserLang = navigator.language.toLowerCase()
  const defaultLang: Language = browserLang.startsWith('zh') ? 'zh' : 'en'
  const lang = (storedLang && (storedLang === 'en' || storedLang === 'zh')) ? storedLang : defaultLang

  return translations[lang]
}

export function ErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()
  const t = useErrorTranslations()

  let title: string = t.errors.general.title
  let message: string = t.errors.general.description
  let details: string | undefined

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`
    message = error.data?.message || error.statusText || t.errors.general.description

    if (error.status === 404) {
      title = t.errors.notFound.title
      message = t.errors.notFound.subtitle
      details = t.errors.notFound.description
    }
  } else if (error instanceof Error) {
    message = error.message
    details = error.stack
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <AlertTriangle className="h-20 w-20 text-destructive" />
          <h1 className="text-3xl font-bold">{title}</h1>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t.errors.general.details}</AlertTitle>
          <AlertDescription className="mt-2">{message}</AlertDescription>
        </Alert>

        {details && (
          <details className="rounded-lg border p-4 text-xs">
            <summary className="cursor-pointer font-medium mb-2">
              {t.errors.general.technicalDetails}
            </summary>
            <pre className="overflow-auto text-muted-foreground whitespace-pre-wrap">
              {details}
            </pre>
          </details>
        )}

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.common.goBack}
          </Button>
          <Button onClick={() => navigate('/')}>
            <Home className="mr-2 h-4 w-4" />
            {t.common.goHome}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t.errors.general.persistentError}
        </p>
      </div>
    </div>
  )
}
