import { useState, useMemo } from 'react'
import { useBudgets } from '../hooks/useBudgets'
import { useCategories } from '../hooks/useCategories'
import { useTranslation } from '../hooks/useTranslation'
import { formatCurrency, formatPercent } from '../lib/utils'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { CurrencyPicker } from '../components/ui/CurrencyPicker'
import { cn } from '../lib/utils'
import { Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

export function Budgets() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const { budgets, loading, createBudget, updateBudget, deleteBudget } = useBudgets(month, year)
  const { categories } = useCategories()
  const { t, locale } = useTranslation()
  const [showAdd, setShowAdd] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingBudget, setEditingBudget] = useState<any>(null)

  const expenseCategories = useMemo(() => categories.filter(c => c.type === 'expense'), [categories])

  const totalBudgeted = useMemo(() => budgets.reduce((sum, b) => sum + b.amount, 0), [budgets])
  const totalSpent = useMemo(() => budgets.reduce((sum, b) => sum + (b.spent || 0), 0), [budgets])
  const totalPct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

  const handlePrevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  const handleNextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const handleAdd = async (data: any) => {
    await createBudget({ ...data, period: 'monthly', month, year })
    setShowAdd(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('budgets.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalBudgeted > 0
              ? `${formatCurrency(totalSpent, undefined, locale)} ${t('budgets.of')} ${formatCurrency(totalBudgeted, undefined, locale)} ${t('budgets.spent')} (${totalPct.toFixed(0)}%)`
              : t('budgets.noBudgetsSet')}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('budgets.add')}
        </button>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3">
        <button onClick={handlePrevMonth} className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-lg font-semibold text-foreground min-w-[140px] text-center">
          {t(`month.${MONTH_KEYS[month - 1]}`)} {year}
        </span>
        <button onClick={handleNextMonth} className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Overall progress */}
      {totalBudgeted > 0 && (() => {
        const primaryCurrency = budgets[0]?.currency || 'USD'
        return (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">{t('budgets.overall')}</span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(totalSpent, primaryCurrency, locale)} / {formatCurrency(totalBudgeted, primaryCurrency, locale)}
              </span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700 ease-out',
                  totalPct > 100 ? 'bg-destructive' : totalPct > 80 ? 'bg-amber-500' : 'bg-primary'
                )}
                style={{ width: `${Math.min(totalPct, 100)}%` }}
              />
            </div>
          </div>
        )
      })()}
      

      {/* Budget cards */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">{t('budgets.noBudgets')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('budgets.setLimits')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map(budget => {
            const pct = budget.pct || 0
            const remaining = budget.remaining || 0
            return (
              <div key={budget.id} onClick={() => setEditingBudget(budget)} className="group p-5 rounded-2xl border border-border/60 bg-card hover:border-border hover:shadow-md cursor-pointer transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-base font-semibold text-foreground">{budget.category}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(budget.spent || 0, budget.currency, locale)} {t('budgets.of')} {formatCurrency(budget.amount, budget.currency, locale)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingId(budget.id) }}
                    className="rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 rounded-full bg-muted overflow-hidden mb-3">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700 ease-out',
                      pct > 100 ? 'bg-destructive' : pct > 80 ? 'bg-amber-500' : 'bg-primary'
                    )}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className={cn(
                    'text-xs font-medium',
                    pct > 100 ? 'text-destructive' : pct > 80 ? 'text-amber-500' : 'text-muted-foreground'
                  )}>
                    {pct.toFixed(0)}% {t('budgets.used')}
                  </span>
                  <span className={cn(
                    'text-xs font-medium',
                    remaining >= 0 ? 'text-muted-foreground' : 'text-destructive'
                  )}>
                    {remaining >= 0 ? `${formatCurrency(remaining, budget.currency, locale)} ${t('budgets.left')}` : `${formatCurrency(Math.abs(remaining), budget.currency, locale)} ${t('budgets.over')}`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Budget Modal */}
      <AddBudgetModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={handleAdd}
        categories={expenseCategories}
        existingCategories={budgets.map(b => b.category)}
      />

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => { if (deletingId) deleteBudget(deletingId) }}
      />

      {/* Edit Budget Modal */}
      {editingBudget && (
        <EditBudgetModal
          open={!!editingBudget}
          budget={editingBudget}
          onClose={() => setEditingBudget(null)}
          onSubmit={async (data) => {
            await updateBudget(editingBudget.id, data)
            setEditingBudget(null)
          }}
          categories={expenseCategories}
        />
      )}
    </div>
  )
}

function AddBudgetModal({
  open,
  onClose,
  onSubmit,
  categories,
  existingCategories,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  categories: any[]
  existingCategories: string[]
}) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')

  const availableCategories = categories.filter(c => !existingCategories.includes(c.name))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({ category, amount: parseFloat(amount) || 0, currency })
      setCategory('')
      setAmount('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-sm">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">{t('budgets.add')}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label mb-1.5 block dark:text-muted-foreground">{t('budgets.category')}</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input" required>
              <option value="">{t('categories.selectCategory')}</option>
              {availableCategories.map(c => (
                <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label mb-1.5 block dark:text-muted-foreground">{t('budgets.monthlyLimit')}</label>
            <div className="flex gap-3">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="input flex-1"
                required
              />
              <CurrencyPicker value={currency} onChange={setCurrency} className="w-40" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{t('account.cancel')}</button>
            <button type="submit" disabled={loading || !category || !amount} className="btn-primary flex-1">
              {loading ? t('loading.adding') : t('budgets.add')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

function EditBudgetModal({
  open,
  budget,
  onClose,
  onSubmit,
  categories,
}: {
  open: boolean
  budget: any
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  categories: any[]
}) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(budget.amount?.toString() || '')
  const [currency, setCurrency] = useState(budget.currency || 'USD')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({ amount: parseFloat(amount) || 0, currency })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-sm">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">{t('account.edit')} {t('budgets.title')}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent dark:hover:bg-gray-700">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label mb-1.5 block dark:text-muted-foreground">{t('budgets.category')}</label>
            <input type="text" value={budget.category} disabled className="input opacity-60 cursor-not-allowed" />
          </div>

          <div>
            <label className="label mb-1.5 block dark:text-muted-foreground">{t('budgets.monthlyLimit')}</label>
            <div className="flex gap-3">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="input flex-1"
                required
              />
              <CurrencyPicker value={currency} onChange={setCurrency} className="w-40" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{t('account.cancel')}</button>
            <button type="submit" disabled={loading || !amount} className="btn-primary flex-1">
              {loading ? t('loading.saving') : t('account.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
