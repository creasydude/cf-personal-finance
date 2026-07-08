import { useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useAccounts } from '../hooks/useAccounts'
import { useCategories } from '../hooks/useCategories'
import { useTranslation } from '../hooks/useTranslation'
import { formatCurrency, formatDate } from '../lib/utils'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { CurrencyPicker } from '../components/ui/CurrencyPicker'

const TYPE_CONFIG = {
  income: { label: 'Income', variant: 'success' as const, color: 'text-emerald-600', icon: '↓' },
  expense: { label: 'Expense', variant: 'danger' as const, color: 'text-red-600', icon: '↑' },
  transfer: { label: 'Transfer', variant: 'info' as const, color: 'text-blue-600', icon: '↔' },
}

export function Transactions() {
  const { transactions, total, loading, filters, setFilters, createTransaction, deleteTransaction } = useTransactions()
  const { accounts } = useAccounts()
  const { categories } = useCategories()
  const { t } = useTranslation()
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')

  const handleSearch = (value: string) => {
    setSearch(value)
    setFilters({ search: value || undefined, page: '1' })
  }

  const handleTypeFilter = (type: string) => {
    setFilters({ type: type || undefined, page: '1' })
  }

  const handleAdd = async (data: any) => {
    await createTransaction(data)
    setShowAdd(false)
  }

  const expenseCategories = categories.filter(c => c.type === 'expense')
  const incomeCategories = categories.filter(c => c.type === 'income')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('transactions.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} {t('transactions.count')}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('transactions.add')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t('transactions.search')}
            className="input pl-10"
          />
        </div>

        {/* Type filter */}
        <select
          value={filters.type || ''}
          onChange={(e) => handleTypeFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">{t('transactions.allTypes')}</option>
          <option value="income">{t('transactions.income')}</option>
          <option value="expense">{t('transactions.expense')}</option>
          <option value="transfer">{t('transactions.transfer')}</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center dark:bg-gray-800">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700">
            <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-6L16.5 18m0 0L12 13.5m4.5 4.5V6" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{t('transactions.noTransactions')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('transactions.addFirst')}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(txn => {
                  const config = TYPE_CONFIG[txn.type as keyof typeof TYPE_CONFIG]
                  return (
                    <tr key={txn.id} className="border-b border-gray-50 dark:border-gray-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(txn.date)}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{txn.description}</p>
                        {txn.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[300px]">{txn.notes}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {txn.category && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                            {txn.category}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={config?.variant}>
                          <span className={config?.color}>{config?.icon}</span>
                          {config?.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-semibold ${config?.color}`}>
                          {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : ''}{formatCurrency(txn.amount, txn.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteTransaction(txn.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-50">
            {transactions.map(txn => {
              const config = TYPE_CONFIG[txn.type as keyof typeof TYPE_CONFIG]
              return (
                <div key={txn.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{txn.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(txn.date)}</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className={`text-sm font-semibold ${config?.color}`}>
                        {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : ''}{formatCurrency(txn.amount, txn.currency)}
                      </p>
                      <Badge variant={config?.variant} className="mt-1">{config?.label}</Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      <AddTransactionModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={handleAdd}
        accounts={accounts}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
      />
    </div>
  )
}

function AddTransactionModal({
  open,
  onClose,
  onSubmit,
  accounts,
  expenseCategories,
  incomeCategories,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  accounts: any[]
  expenseCategories: any[]
  incomeCategories: any[]
}) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [accountId, setAccountId] = useState('')
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const categories = type === 'income' ? incomeCategories : expenseCategories

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data: any = {
        type,
        description,
        amount: parseFloat(amount) || 0,
        currency,
        category: category || undefined,
        date,
        notes: notes || undefined,
      }

      if (type === 'transfer') {
        data.from_account_id = fromAccountId
        data.to_account_id = toAccountId
      } else {
        data.account_id = accountId
      }

      await onSubmit(data)
      resetForm()
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setType('expense')
    setDescription('')
    setAmount('')
    setCurrency('USD')
    setAccountId('')
    setFromAccountId('')
    setToAccountId('')
    setCategory('')
    setDate(new Date().toISOString().split('T')[0])
    setNotes('')
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('transactions.add')}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type tabs — dark pill style */}
          <div className="flex gap-2 rounded-2xl bg-[#1a1a1a] dark:bg-gray-700 p-1.5">
            {([
              { key: 'expense' as const, label: t('transactions.expense'), icon: (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M8 12h8" />
                </svg>
              )},
              { key: 'income' as const, label: t('transactions.income'), icon: (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 8v8m-4-4h8" />
                </svg>
              )},
              { key: 'transfer' as const, label: t('transactions.transfer'), icon: (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              )},
            ]).map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => { setType(t.key); setCategory('') }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  type === t.key
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-200'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Description */}
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('account.name')}
            className="input"
            required
          />

          {/* Amount + Currency */}
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
            <CurrencyPicker value={currency} onChange={setCurrency} className="w-48" />
          </div>

          {/* Account */}
          {type === 'transfer' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label mb-1 block dark:text-gray-400">{t('transactions.from')}</label>
                <select value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} className="input" required>
                  <option value="">{t('account.selectAccount')}</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label mb-1 block dark:text-gray-400">{t('transactions.to')}</label>
                <select value={toAccountId} onChange={e => setToAccountId(e.target.value)} className="input" required>
                  <option value="">{t('account.selectAccount')}</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <select value={accountId} onChange={e => setAccountId(e.target.value)} className="input" required>
              <option value="">{t('account.selectAccount')}</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}

          {/* Category */}
          <select value={category} onChange={e => setCategory(e.target.value)} className="input">
            <option value="">{t('account.noCategory')}</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
          </select>

          {/* Date */}
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />

          {/* Notes */}
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={t('settings.nickname') + ' (' + t('account.balance') + ')'}
            className="input min-h-[80px] resize-none"
          />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{t('account.cancel')}</button>
            <button type="submit" disabled={loading || !description || !amount} className="btn-primary flex-1">
              {loading ? 'Adding...' : t('transactions.add')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
