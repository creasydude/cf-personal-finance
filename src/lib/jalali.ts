/**
 * Gregorian ↔ Jalali (Shamsi) date converter
 * Uses jalaali-js library for reliable conversion
 */
import { toJalaali, toGregorian } from 'jalaali-js'

const JALALI_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']

export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  return toJalaali(gy, gm, gd)
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  return toGregorian(jy, jm, jd)
}

export function formatDateJalali(dateStr: string): string {
  const d = new Date(dateStr)
  const { jy, jm, jd } = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  return `${jd} ${JALALI_MONTHS[jm - 1]} ${jy}`
}

export function formatDateShortJalali(dateStr: string): string {
  const d = new Date(dateStr)
  const { jy, jm, jd } = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  return `${jy}/${jm}/${jd}`
}

export function toJalaliInput(gy: number, gm: number, gd: number): string {
  const { jy, jm, jd } = toJalaali(gy, gm, gd)
  return `${jy}-${String(jm).padStart(2, '0')}-${String(jd).padStart(2, '0')}`
}

export function fromJalaliInput(dateStr: string): { gy: number; gm: number; gd: number } {
  const parts = dateStr.replace(/\//g, '-').split('-').map(Number)
  return toGregorian(parts[0], parts[1], parts[2])
}
