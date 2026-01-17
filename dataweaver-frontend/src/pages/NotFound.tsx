import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/I18nContext'

export function NotFound() {
  const navigate = useNavigate()
  const { t } = useI18n()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <AlertCircle className="h-24 w-24 text-muted-foreground/50 mb-6" />
      <h1 className="text-4xl font-bold mb-2">{t.errors.notFound.title}</h1>
      <h2 className="text-xl font-semibold mb-4">{t.errors.notFound.subtitle}</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        {t.errors.notFound.description}
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          {t.common.goBack}
        </Button>
        <Button onClick={() => navigate('/')}>{t.common.goHome}</Button>
      </div>
    </div>
  )
}
