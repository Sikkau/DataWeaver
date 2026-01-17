import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { translations } from './translations'
import type { Language } from './translations'

type Translations = typeof translations.en | typeof translations.zh

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const STORAGE_KEY = 'dataweaver-language'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get saved language from localStorage
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'zh') {
      return saved
    }
    // Detect browser language
    const browserLang = navigator.language.toLowerCase()
    return browserLang.startsWith('zh') ? 'zh' : 'en'
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)
    // Update HTML lang attribute
    document.documentElement.lang = lang
  }

  useEffect(() => {
    // Set initial HTML lang attribute
    document.documentElement.lang = language
  }, [])

  const value: I18nContextType = {
    language,
    setLanguage,
    t: translations[language],
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
