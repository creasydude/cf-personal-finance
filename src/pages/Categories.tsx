import { useState } from 'react'
import { useCategories } from '../hooks/useCategories'
import { useTranslation } from '../hooks/useTranslation'
import { Modal } from '../components/ui/Modal'
import { cn } from '../lib/utils'

const EMOJI_OPTIONS = [
  '💼', '💻', '📈', '🏠', '🚀', '🎁', '💰', '🛒', '🍽️', '☕',
  '🏥', '🏋️', '👔', '🎬', '📱', '✈️', '🏛️', '📦', '💡', '🌐',
  '🛡️', '🔧', '🚗', '⛽', '🚇', '🅿️', '🐕', '👶', '📚', '❤️',
  '🎓', '🎵', '🎮', '🏖️', '🎄', '🎂', '🔧', '🧹', '💇', '🧺',
]

export function Categories() {
  const { categories, loading, createCategory, deleteCategory } = useCategories()
  const { t } = useTranslation()
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')

  const filtered = categories.filter(c => filter === 'all' || c.type === filter)
  const incomeCategories = filtered.filter(c => c.type === 'income')
  const expenseCategories = filtered.filter(c => c.type === 'expense')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{categories.length} {t('categories.title')}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('categories.add')}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 w-fit">
        {(['all', 'income', 'expense'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              filter === f ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {f === 'all' ? t('tab.all') : f === 'income' ? t('categories.income') : t('categories.expense')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center dark:bg-gray-800">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700">
            <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{t('categories.noCategories')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('categories.createFirst')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Income categories */}
          {incomeCategories.length > 0 && (
            <div>
              <h3 className="label px-1 mb-3">{t('categories.income')}</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {incomeCategories.map(cat => (
                  <CategoryCard key={cat.id} category={cat} onDelete={deleteCategory} />
                ))}
              </div>
            </div>
          )}

          {/* Expense categories */}
          {expenseCategories.length > 0 && (
            <div>
              <h3 className="label px-1 mb-3">{t('categories.expense')}</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {expenseCategories.map(cat => (
                  <CategoryCard key={cat.id} category={cat} onDelete={deleteCategory} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add modal */}
      <AddCategoryModal open={showAdd} onClose={() => setShowAdd(false)} onSubmit={createCategory} />
    </div>
  )
}

function CategoryCard({ category, onDelete }: { category: any; onDelete: (id: string) => void }) {
  return (
    <div className="card-hover flex items-center gap-3 p-3 group">
      <div className={cn(
        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg',
        category.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'
      )}>
        {category.icon || '📦'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{category.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{category.type}</p>
      </div>
      <button
        onClick={() => onDelete(category.id)}
        className="rounded-lg p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}

function AddCategoryModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [icon, setIcon] = useState('📦')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({ name, type, icon })
      setName('')
      setType('expense')
      setIcon('📦')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-sm">
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Add Category</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div className="flex gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
            {(['expense', 'income'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  type === t ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Icon picker */}
          <div>
            <label className="label mb-1.5 block">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-all',
                    icon === e ? 'bg-brand-100 ring-2 ring-brand-500' : 'hover:bg-gray-100'
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="label mb-1.5 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Groceries, Salary"
              className="input"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading || !name} className="btn-primary flex-1">
              {loading ? 'Adding...' : t('categories.add')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
