import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDateJalali as _formatDateJalali, toJalaliInput as _toJalaliInput, fromJalaliInput as _fromJalaliInput } from './jalali'
import { toJalaali } from 'jalaali-js'

export { _formatDateJalali as formatDateJalali, _toJalaliInput as toJalaliInput, _fromJalaliInput as fromJalaliInput }

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toPersianNumber(str: string | number): string {
  return String(str).replace(/\d/g, d => persianDigits[parseInt(d)])
}

export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en', useToman?: boolean): string {
  const loc = locale === 'fa' ? 'fa-IR' : 'en-US'
  const tomanEnabled = useToman ?? (typeof window !== 'undefined' && localStorage.getItem('useToman') === 'true')
  const displayAmount = (tomanEnabled && currency === 'IRR') ? amount / 10 : amount
  const isToman = tomanEnabled && currency === 'IRR'

  const customCurrencies: Record<string, Record<string, string>> = {
    IRR: { en: isToman ? 'Toman' : 'IRR', fa: isToman ? 'تومان' : 'ریال' },
    GOLD_GRAM24: { en: 'g Au 24K', fa: 'گرم طلای ۲۴ عیار' },
    GOLD_GRAM18: { en: 'g Au 18K', fa: 'گرم طلای ۱۸ عیار' },
    GOLD_GRAM22: { en: 'g Au 22K', fa: 'گرم طلای ۲۲ عیار' },
    XAU: { en: 'oz Au', fa: 'اونس طلا' },
  }

  if (customCurrencies[currency]) {
    const label = customCurrencies[currency][locale] || customCurrencies[currency].en
    const formatted = new Intl.NumberFormat(loc, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(displayAmount)
    return `${formatted} ${label}`
  }

  try {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(displayAmount)
  } catch {
    return `${new Intl.NumberFormat(loc).format(displayAmount)} ${currency}`
  }
}

export function formatNumber(n: number, locale: string = 'en'): string {
  return new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US').format(n)
}

export function formatPercent(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

export function formatDate(date: string, locale: string = 'en', dateFormat?: string): string {
  if (dateFormat === 'jalali') {
    return _formatDateJalali(date)
  }
  const monthNamesFa = ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر']
  const d = new Date(date)
  return locale === 'fa' ? `${d.getDate()} ${monthNamesFa[d.getMonth()]} ${d.getFullYear()}` : `${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
}

export function formatDateShort(date: string, locale: string = 'en'): string {
  return new Date(date).toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function jalaliMonthName(month: number): string {
  return ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'][month - 1] || ''
}

export function getGregorianMonthName(month: number): string {
  return ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'][month - 1] || ''
}

export function getJalaliMonthName(gregMonth: number, gregYear?: number): string {
  const jalaliMonthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
  // Use middle of the Gregorian month to find the corresponding Jalali month
  const year = gregYear || new Date().getFullYear()
  const { jm } = toJalaali(year, gregMonth, 15)
  return jalaliMonthNames[jm - 1] || ''
}

export function cnx(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}
