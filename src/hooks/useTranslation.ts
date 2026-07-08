import { useMemo } from 'react'
import { t, getLocale, type Locale } from '../lib/i18n'

export function useTranslation(settings: Record<string, any>) {
  const locale = useMemo(() => getLocale(settings), [settings])

  const translate = (key: string) => t(key, locale)

  return { t: translate, locale, isRTL: locale === 'fa' }
}
