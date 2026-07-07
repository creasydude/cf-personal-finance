import type { ApiError } from '../types'

const BASE_URL = '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'same-origin',
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as ApiError
    throw new Error(body.error || `Request failed: ${res.status}`)
  }

  return res.json() as Promise<T>
}

export const api = {
  // Auth
  auth: {
    register: () => request<{ code: string; userId: string }>('/auth/register', { method: 'POST' }),
    login: (code: string) => request<{ userId: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ code }) }),
    logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
    me: () => request<{ userId: string; code: string; settings: Record<string, unknown> }>('/auth/me'),
  },

  // Accounts
  accounts: {
    list: () => request<{ accounts: any[]; assets_total: number; liabilities_total: number }>('/accounts'),
    create: (data: any) => request<any>('/accounts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ ok: boolean }>(`/accounts/${id}`, { method: 'DELETE' }),
  },

  // Transactions
  transactions: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request<{ transactions: any[]; total: number }>(`/transactions${qs}`)
    },
    create: (data: any) => request<any>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ ok: boolean }>(`/transactions/${id}`, { method: 'DELETE' }),
  },

  // Budgets
  budgets: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request<{ budgets: any[] }>(`/budgets${qs}`)
    },
    create: (data: any) => request<any>('/budgets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ ok: boolean }>(`/budgets/${id}`, { method: 'DELETE' }),
  },

  // Net Worth
  netWorth: (range?: string) =>
    request<any>(`/net-worth${range ? `?range=${range}` : ''}`),

  // Categories
  categories: {
    list: () => request<{ categories: any[] }>('/categories'),
    create: (data: any) => request<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ ok: boolean }>(`/categories?id=${id}`, { method: 'DELETE' }),
  },

  // Currencies
  currencies: () => request<{ currencies: any[] }>('/currencies'),

  // Settings
  settings: {
    get: () => request<{ settings: any }>('/settings'),
    update: (data: any) => request<any>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  },

  // Export / Import / Account management
  exportData: () => request<any>('/export'),
  importData: (data: any) => request<any>('/import', { method: 'POST', body: JSON.stringify(data) }),
  deleteAccount: () => request<{ ok: boolean }>('/account', { method: 'DELETE' }),
  resetAccount: () => request<{ ok: boolean }>('/account/reset', { method: 'POST' }),

  // Currency conversion
  convertCurrency: (from: string, to: string, amount: number) =>
    request<any>(`/convert?from=${from}&to=${to}&amount=${amount}`),

  // Exchange rates (cached, auto-refreshes)
  rates: () => request<any>('/rates'),
}
