import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toPersianNumber(str: string | number): string {
  return String(str).replace(/\d/g, d => persianDigits[parseInt(d)])
}

export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en'): string {
  const customCurrencies: Record<string, string> = {
    IRR: 'IRR',
    GOLD_GRAM24: 'g Au24',
    GOLD_GRAM18: 'g Au18',
    GOLD_GRAM22: 'g Au22',
    XAU: 'oz Au',
  }

  const loc = locale === 'fa' ? 'fa-IR' : 'en-US'

  if (customCurrencies[currency]) {
    const formatted = new Intl.NumberFormat(loc, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
    return `${formatted} ${customCurrencies[currency]}`
  }

  try {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${new Intl.NumberFormat(loc).format(amount)} ${currency}`
  }
}

export function formatNumber(n: number, locale: string = 'en'): string {
  return new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US').format(n)
}

export function formatPercent(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

export function formatDate(date: string, locale: string = 'en'): string {
  return new Date(date).toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateShort(date: string, locale: string = 'en'): string {
  return new Date(date).toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function cnx(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}
