import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Lang } from '../types'

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (en: string, ar: string) => string
}

const LangContext = createContext<LangContextValue>({
  lang: 'ar',
  setLang: () => {},
  t: (_en: string, ar: string) => ar,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ar')

  return (
    <LangContext.Provider
      value={{ lang, setLang, t: (en, ar) => (lang === 'ar' ? ar : en) }}
    >
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
