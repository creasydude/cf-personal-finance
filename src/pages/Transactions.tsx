import { useState, useRef, useEffect } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useAccounts } from '../hooks/useAccounts'
import { useCategories } from '../hooks/useCategories'
import { useTranslation } from '../hooks/useTranslation'
import { useSettings } from '../lib/settings-context'
import { formatCurrency, formatDate, formatDateJalali, toJalaliInput, fromJalaliInput } from '../lib/utils'
import { api } from '../api/client'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { CurrencyPicker } from '../components/ui/CurrencyPicker'
import { Plus, Search, Trash2, Info } from 'lucide-react'

const TYPE_CONFIG = {
  income: { key: 'transactions.income', variant: 'success' as const, color: 'text-emerald-600 dark:text-emerald-400', icon: '↓' },
  expense: { key: 'transactions.expense', variant: 'destructive' as const, color: 'text-red-600 dark:text-red-400', icon: '↑' },
  transfer: { key: 'transactions.transfer', variant: 'info' as const, color: 'text-blue-600 dark:text-blue-400', icon: '↔' },
}

export function Transactions() {
  const { transactions, total, loading, filters, setFilters, createTransaction, deleteTransaction, refetch } = useTransactions()
  const { accounts } = useAccounts()
  const { categories } = useCategories()
  const { t, locale } = useTranslation()
  const settings = useSettings()
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [detailTxn, setDetailTxn] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingTxn, setEditingTxn] = useState<any>(null)

  const handleSearch = (value: string) => {
    setSearch(value)
    setFilters({ search: value || undefined, page: '1' })
  }

  const handleTypeFilter = (type: string) => {
    setFilters({ type: type || undefined, page: '1' })
  }

  const handleAdd = async (data: any) => {
    const txn = await createTransaction(data)
    setShowAdd(false)
    return txn
  }

  const handleEdit = async (data: any) => {
    if (!editingTxn) return
    await api.transactions.update(editingTxn.id, data)
    refetch()
    setEditingTxn(null)
  }

  const expenseCategories = categories.filter(c => c.type === 'expense')
  const incomeCategories = categories.filter(c => c.type === 'income')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('transactions.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} {t('transactions.count')}</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          {t('transactions.add')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t('transactions.search')}
            className="input ps-10"
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

        {/* Category filter */}
        <select
          value={filters.category || ''}
          onChange={(e) => setFilters({ category: e.target.value || undefined, page: '1' })}
          className="input w-auto"
        >
          <option value="">{t('transactions.allCategories')}</option>
          {categories.map(c => (
            <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={`${filters.sort || 'date'}-${filters.order || 'desc'}`}
          onChange={(e) => {
            const [sort, order] = e.target.value.split('-')
            setFilters({ sort, order, page: '1' })
          }}
          className="input w-auto"
        >
          <option value="date-desc">{t('transactions.newest')}</option>
          <option value="date-asc">{t('transactions.oldest')}</option>
          <option value="amount-desc">{t('transactions.highestAmount')}</option>
          <option value="amount-asc">{t('transactions.lowestAmount')}</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700">
            <svg className="h-8 w-8 text-muted-foreground dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-6L16.5 18m0 0L12 13.5m4.5 4.5V6" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{t('transactions.noTransactions')}</p>
          <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">{t('transactions.addFirst')}</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('table.date')}</th>
                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('table.description')}</th>
                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('table.category')}</th>
                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('table.type')}</th>
                    <th className="px-4 py-3 text-end text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('table.amount')}</th>
                    <th className="px-4 py-3 text-end text-xs font-semibold uppercase tracking-wider text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                {transactions.map(txn => {
                  const config = TYPE_CONFIG[txn.type as keyof typeof TYPE_CONFIG]
                  return (
                    <tr key={txn.id} onClick={() => setEditingTxn(txn)} className="border-b border-border/50 last:border-0 hover:bg-accent/50 transition-colors cursor-pointer">
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(txn.date, locale)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{txn.description}</p>
                          {txn.attachment_count > 0 && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.686 7.687a1.5 1.5 0 002.112 2.13" />
                              </svg>
                              {txn.attachment_count}
                            </span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setDetailTxn(txn) }}
                            className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                            title={t('transactions.details')}
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </div>
                        {txn.notes && <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5 truncate max-w-[200px]">{txn.notes}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {txn.category && (
                          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            {txn.category}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={config?.variant}>
                          <span className={config?.color}>{config?.icon}</span>
                          {config?.key ? t(config.key) : ''}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <span className={`text-sm font-semibold ${config?.color}`}>
                          {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : ''}{formatCurrency(txn.amount, txn.currency, locale)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletingId(txn.id) }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border">
            {transactions.map(txn => {
              const config = TYPE_CONFIG[txn.type as keyof typeof TYPE_CONFIG]
              return (
                <div key={txn.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{txn.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(txn.date, locale)}</p>
                    </div>
                    <div className="text-end ms-3">
                      <p className={`text-sm font-semibold ${config?.color}`}>
                        {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : ''}{formatCurrency(txn.amount, txn.currency, locale)}
                      </p>
                      <Badge variant={config?.variant} className="mt-1">{config?.key ? t(config.key) : ''}</Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
        </Card>
      )}

      {/* Add Transaction Modal */}
      <AddTransactionModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={handleAdd}
        onUploaded={refetch}
        accounts={accounts}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        settings={settings}
      />

      {/* Detail Modal */}
      {detailTxn && (
        <TransactionDetailModal
          txn={detailTxn}
          onClose={() => setDetailTxn(null)}
          locale={locale}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => { if (deletingId) deleteTransaction(deletingId) }}
      />

      {/* Edit Transaction Modal */}
      {editingTxn && (
        <AddTransactionModal
          open={!!editingTxn}
          onClose={() => setEditingTxn(null)}
          onSubmit={handleEdit}
          accounts={accounts}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          editData={editingTxn}
          settings={settings}
        />
      )}
    </div>
  )
}

function AddTransactionModal({
  open,
  onClose,
  onSubmit,
  onUploaded,
  accounts,
  expenseCategories,
  incomeCategories,
  editData,
  settings,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<any>
  onUploaded?: () => void
  accounts: any[]
  expenseCategories: any[]
  incomeCategories: any[]
  editData?: any
  settings?: any
}) {
  const { t } = useTranslation()
  const useJalali = settings?.dateFormat === 'jalali'
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
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const jalaliDateRef = useRef('')

  // Pre-fill form when editing
  useEffect(() => {
    if (editData && open) {
      setType(editData.type || 'expense')
      setDescription(editData.description || '')
      setAmount(editData.amount?.toString() || '')
      setCurrency(editData.currency || 'USD')
      setAccountId(editData.account_id || '')
      setFromAccountId(editData.from_account_id || '')
      setToAccountId(editData.to_account_id || '')
      setCategory(editData.category || '')
      // Extract only YYYY-MM-DD from the date string
      const rawDate = editData.date || new Date().toISOString().split('T')[0]
      setDate(rawDate.includes('T') ? rawDate.split('T')[0] : rawDate)
      setNotes(editData.notes || '')
      setFiles([])
    } else if (open) {
      resetForm()
    }
  }, [editData, open])

  const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff',
    'application/pdf',
    'text/csv',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.tif', '.pdf', '.csv', '.doc', '.docx', '.xls', '.xlsx']

  const categories = type === 'income' ? incomeCategories : expenseCategories

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('')
    const selected = Array.from(e.target.files || [])
    const rejected: string[] = []
    const accepted: File[] = []
    const maxSize = 500 * 1024

    for (const file of selected) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
        rejected.push(file.name)
      } else if (file.size > maxSize) {
        rejected.push(file.name + ' (' + t('transactions.fileTooLarge') + ')')
      } else {
        accepted.push(file)
      }
    }

    if (rejected.length > 0) {
      setFileError(t('transactions.unsupportedFormat') + ': ' + rejected.join(', '))
    }
    if (accepted.length > 0) {
      setFiles(prev => [...prev, ...accepted])
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Convert Jalali date to Gregorian if setting is jalali
      let submitDate = date
      if (settings.dateFormat === 'jalali' && jalaliDateRef.current) {
        const parts = jalaliDateRef.current.split('-').map(Number)
        if (parts.length === 3 && parts[0] > 1000) {
          const { gy, gm, gd } = fromJalaliInput(jalaliDateRef.current)
          submitDate = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`
        }
      }

      const data: any = {
        type,
        description,
        amount: parseFloat(amount) || 0,
        currency,
        category: category || undefined,
        date: submitDate,
        notes: notes || undefined,
      }

      if (type === 'transfer') {
        data.from_account_id = fromAccountId
        data.to_account_id = toAccountId
      } else {
        data.account_id = accountId
      }

      await onSubmit(data).then(async (txn: any) => {
        if (txn?.id && files.length > 0) {
          for (const file of files) {
            try {
              await api.attachments.upload(txn.id, file)
            } catch (err) {
              console.error('Attachment upload failed:', file.name, err)
            }
          }
          onUploaded?.()
        }
      })
      resetForm()
      setFiles([])
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
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editData ? t('account.edit') : t('transactions.add')}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent">
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
                    : 'text-muted-foreground dark:text-gray-500 hover:text-gray-200'
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
                <label className="label mb-1 block dark:text-muted-foreground">{t('transactions.from')}</label>
                <select value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} className="input" required>
                  <option value="">{t('account.selectAccount')}</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label mb-1 block dark:text-muted-foreground">{t('transactions.to')}</label>
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
          <div>
            <label className="label mb-1.5">{t('table.date')}</label>
            {settings.dateFormat === 'jalali' ? (
              <input
                type="text"
                defaultValue={toJalaliInput(...date.split('-').map(Number) as [number, number, number])}
                key={`${date}-jal`}
                onBlur={e => { jalaliDateRef.current = e.target.value.replace(/\//g, '-') }}
                onKeyDown={e => { if (e.key === 'Enter') jalaliDateRef.current = (e.target as HTMLInputElement).value.replace(/\//g, '-') }}
                placeholder="1404/04/19"
                className="input"
              />
            ) : (
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
            )}
          </div>

          {/* Notes */}
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={t('transactions.notes')}
            className="input min-h-[80px] resize-none"
          />

          {/* Attachments */}
          <div>
            <label className="label mb-1.5 block dark:text-muted-foreground">{t('transactions.attachments')}</label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff,.tif,.pdf,.csv,.doc,.docx,.xls,.xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary w-full"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.686 7.687a1.5 1.5 0 002.112 2.13" />
              </svg>
              {t('transactions.attachFile')}
            </button>
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm">
                    <span className="truncate text-gray-700 dark:text-gray-300">{file.name}</span>
                    <button type="button" onClick={() => removeFile(i)} className="ml-2 text-muted-foreground hover:text-destructive">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {fileError && (
              <p className="mt-2 text-xs text-destructive dark:text-red-400">{fileError}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{t('account.cancel')}</button>
            <button type="submit" disabled={loading || !description || !amount} className="btn-primary flex-1">
              {loading ? t('loading.saving') : editData ? t('account.saveChanges') : t('transactions.add')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

function TransactionDetailModal({ txn, onClose, locale }: { txn: any; onClose: () => void; locale: string }) {
  const { t } = useTranslation()
  const [attachments, setAttachments] = useState<any[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(true)

  useEffect(() => {
    api.attachments.list(txn.id).then(res => {
      setAttachments(res.attachments)
      setLoadingAttachments(false)
    }).catch(() => setLoadingAttachments(false))
  }, [txn.id])

  const config = TYPE_CONFIG[txn.type as keyof typeof TYPE_CONFIG]
  const isImage = (ct: string) => ct?.startsWith('image/')
  const isPDF = (ct: string) => ct === 'application/pdf'

  return (
    <Modal open={true} onClose={onClose} className="max-w-lg">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('transactions.details')}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent dark:hover:bg-gray-700">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Description */}
          <div>
            <p className="label mb-1">{t('table.description')}</p>
            <p className="text-sm text-gray-900 dark:text-white">{txn.description}</p>
          </div>

          {/* Notes */}
          {txn.notes && (
            <div>
              <p className="label mb-1">{t('transactions.notes')}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{txn.notes}</p>
            </div>
          )}

          {/* Meta */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="label mb-1">{t('table.date')}</p>
              <p className="text-sm text-foreground">{formatDate(txn.date, locale)}</p>
            </div>
            <div>
              <p className="label mb-1">{t('table.type')}</p>
              <Badge variant={config?.variant}>
                <span className={config?.color}>{config?.icon}</span>
                {config?.key ? t(config.key) : ''}
              </Badge>
            </div>
            <div>
              <p className="label mb-1">{t('table.amount')}</p>
              <p className={`text-sm font-semibold ${config?.color}`}>
                {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : ''}{formatCurrency(txn.amount, txn.currency, locale)}
              </p>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <p className="label mb-2">{t('transactions.attachments')}</p>
            {loadingAttachments ? (
              <div className="flex h-10 items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
            ) : attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground dark:text-gray-500">—</p>
            ) : (
              <div className="space-y-2">
                {attachments.map(att => (
                  <div key={att.id} className="rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {isImage(att.content_type) && (
                      <a href={api.attachments.getUrl(att.id)} target="_blank" rel="noopener noreferrer">
                        <img
                          src={api.attachments.getUrl(att.id)}
                          alt={att.filename}
                          className="w-full max-h-48 object-cover bg-gray-100 dark:bg-gray-700"
                        />
                      </a>
                    )}
                    <a
                      href={api.attachments.getUrl(att.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${isImage(att.content_type) ? 'bg-emerald-50 dark:bg-emerald-900/30' : isPDF(att.content_type) ? 'bg-red-50 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        {isImage(att.content_type) ? (
                          <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                          </svg>
                        ) : isPDF(att.content_type) ? (
                          <svg className="h-4 w-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{att.filename}</p>
                        <p className="text-xs text-muted-foreground">{(att.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <svg className="h-4 w-4 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
