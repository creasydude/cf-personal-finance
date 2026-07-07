// ─── Account Types ───────────────────────────────────────────
export type AccountType =
  | 'cash'
  | 'investment'
  | 'crypto'
  | 'gold'
  | 'property'
  | 'vehicle'
  | 'credit_card'
  | 'loan'
  | 'other_asset'
  | 'other_liability'

export type CashSubtype = 'checking' | 'savings' | 'cash' | 'other'

export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  subtype?: string
  currency: string
  balance: number
  details: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AccountWithMeta extends Account {
  weight?: number
  change_pct?: number
  converted_balance?: number
}

// ─── Transaction Types ───────────────────────────────────────
export type TransactionType = 'income' | 'expense' | 'transfer'

export interface Transaction {
  id: string
  user_id: string
  account_id?: string
  from_account_id?: string
  to_account_id?: string
  type: TransactionType
  description: string
  amount: number
  currency: string
  converted_amount?: number
  category?: string
  date: string
  tags: string[]
  notes?: string
  created_at: string
}

// ─── Budget Types ────────────────────────────────────────────
export type BudgetPeriod = 'monthly' | 'yearly'

export interface Budget {
  id: string
  user_id: string
  category: string
  amount: number
  period: BudgetPeriod
  month?: number
  year: number
  created_at: string
}

export interface BudgetWithSpent extends Budget {
  spent: number
  remaining: number
  pct: number
}

// ─── Category Types ──────────────────────────────────────────
export interface Category {
  id: string
  user_id: string
  name: string
  type: 'income' | 'expense'
  icon?: string
  is_default: boolean
}

// ─── Currency Types ──────────────────────────────────────────
export interface Currency {
  code: string
  name: string
  symbol: string
  type: 'fiat' | 'crypto' | 'gold'
}

// ─── Net Worth ───────────────────────────────────────────────
export interface NetWorthPoint {
  date: string
  value: number
}

export interface NetWorthResponse {
  current: number
  previous: number
  change: number
  change_pct: number
  history: NetWorthPoint[]
  by_type: { type: AccountType; value: number; label: string }[]
}

// ─── Settings ────────────────────────────────────────────────
export interface UserSettings {
  baseCurrency: string
  displayName?: string
}

// ─── API Responses ───────────────────────────────────────────
export interface ApiError {
  error: string
  message?: string
}

// ─── Cloudflare Bindings (for Pages Functions) ──────────────
// Env type — available in Pages Functions via @cloudflare/workers-types
export interface Env {
  DB: D1Database
  RATE_CACHE: KVNamespace
  SESSION_SIGNING_KEY: string
  CURRENCY_API_BASE: string
  CURRENCY_API_KEY: string
}
