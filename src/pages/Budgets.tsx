import { useState, useMemo } from 'react'
import { useBudgets } from '../hooks/useBudgets'
import { useCategories } from '../hooks/useCategories'
import { useTranslation } from '../hooks/useTranslation'
import { formatCurrency, formatPercent } from '../lib/utils'
import { Modal } from '../components/ui/Modal'
import { cn } from '../lib/utils'

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

export function Budgets() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const { budgets, loading, createBudget, deleteBudget } = useBudgets(month, year)
  const { categories } = useCategories()
  const { t } = useTranslation()
  const [showAdd, setShowAdd] = useState(false)

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('budgets.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {totalBudgeted > 0
              ? `${formatCurrency(totalSpent)} ${t('budgets.of')} ${formatCurrency(totalBudgeted)} ${t('budgets.spent')} (${totalPct.toFixed(0)}%)`
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
        <button onClick={handlePrevMonth} className="rounded-lg p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[140px] text-center">
          {t(`month.${MONTH_KEYS[month - 1]}`)} {year}
        </span>
        <button onClick={handleNextMonth} className="rounded-lg p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Overall progress */}
      {totalBudgeted > 0 && (
        <div className="card p-6 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('budgets.overall')}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatCurrency(totalSpent)} / {formatCurrency(totalBudgeted)}
            </span>
          </div>
          <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                totalPct > 100 ? 'bg-red-500' : totalPct > 80 ? 'bg-amber-500' : 'bg-brand-500'
              )}
              style={{ width: `${Math.min(totalPct, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Budget cards */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center dark:bg-gray-800">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700">
            <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{t('budgets.noBudgets')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('budgets.setLimits')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map(budget => {
            const pct = budget.pct || 0
            const remaining = budget.remaining || 0
            return (
              <div key={budget.id} className="card-hover p-5 dark:bg-gray-800">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{budget.category}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatCurrency(budget.spent || 0)} of {formatCurrency(budget.amount)}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteBudget(budget.id)}
                    className="rounded-lg p-1 text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-brand-500'
                    )}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className={cn(
                    'text-xs font-medium',
                    pct > 100 ? 'text-red-600 dark:text-red-400' : pct > 80 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'
                  )}>
                    {pct.toFixed(0)}% used
                  </span>
                  <span className={cn(
                    'text-xs',
                    remaining >= 0 ? 'text-gray-500 dark:text-gray-400' : 'text-red-600 dark:text-red-400'
                  )}>
                    {remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}
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

  const availableCategories = categories.filter(c => !existingCategories.includes(c.name))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({ category, amount: parseFloat(amount) || 0 })
      setCategory('')
      setAmount('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-sm">
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('budgets.add')}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label mb-1.5 block dark:text-gray-400">{t('budgets.category')}</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input" required>
              <option value="">{t('categories.selectCategory')}</option>
              {availableCategories.map(c => (
                <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label mb-1.5 block dark:text-gray-400">{t('budgets.monthlyLimit')}</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="input"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{t('account.cancel')}</button>
            <button type="submit" disabled={loading || !category || !amount} className="btn-primary flex-1">
              {loading ? 'Adding...' : t('budgets.add')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
