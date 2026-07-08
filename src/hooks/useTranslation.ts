import { useMemo } from 'react'
import { t, getLocale, type Locale } from '../lib/i18n'
import { useSettings } from '../lib/settings-context'

export function useTranslation(overrides?: Record<string, any>) {
  const ctxSettings = useSettings()
  const settings = { ...ctxSettings, ...overrides }
  const locale = useMemo(() => getLocale(settings), [settings])

  const translate = (key: string) => t(key, locale)

  return { t: translate, locale, isRTL: locale === 'fa' }
}
