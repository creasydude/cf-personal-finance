import { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { CurrencyPicker } from './ui/CurrencyPicker'
import { useTranslation } from '../hooks/useTranslation'
import type { AccountType } from '../types'

interface AccountFormProps {
  open: boolean
  type: AccountType
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  account?: any // for edit mode
}

const ACCOUNT_TYPE_KEYS: Record<AccountType, string> = {
  cash: 'account.cash',
  investment: 'account.investment',
  crypto: 'account.crypto',
  gold: 'account.gold',
  property: 'account.property',
  vehicle: 'account.vehicle',
  credit_card: 'account.creditCard',
  loan: 'account.loan',
  other_asset: 'account.otherAsset',
  other_liability: 'account.otherLiability',
}

const CASH_SUBTYPES = [
  { key: 'cash.checking', value: 'checking' },
  { key: 'cash.savings', value: 'savings' },
  { key: 'cash.cash', value: 'cash' },
  { key: 'cash.other', value: 'other' },
]

export function AccountForm({ open, type, onClose, onSubmit, onDelete, account }: AccountFormProps) {
  const { t } = useTranslation()
  const isEditing = !!account
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [subtype, setSubtype] = useState('')
  const [details, setDetails] = useState<Record<string, string>>({})

  // Reset form when account/open changes
  useEffect(() => {
    if (open) {
      setName(account?.name || '')
      setBalance(account?.balance?.toString() || '')
      setCurrency(account?.currency || (type === 'gold' ? 'GOLD_GRAM18' : type === 'crypto' ? 'BTC' : 'USD'))
      setSubtype(account?.subtype || '')
      setDetails(account?.details || {})
    }
  }, [open, account, type])

  const isLiability = ['credit_card', 'loan', 'other_liability'].includes(type)
  const isGold = type === 'gold'
  const isCrypto = type === 'crypto'
  const isCashOrInvestment = type === 'cash' || type === 'investment'
  const currencyFilter = isGold ? 'gold' : isCrypto ? 'crypto' : isCashOrInvestment ? 'fiat' : undefined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        name,
        type,
        subtype: subtype || undefined,
        currency,
        // For gold: backend calculates balance from grams, don't send stale balance
        ...(isGold ? {} : { balance: parseFloat(balance) || 0 }),
        details,
      })
      resetForm()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setBalance('')
    setCurrency(type === 'gold' ? 'GOLD_GRAM18' : type === 'crypto' ? 'BTC' : 'USD')
    setSubtype('')
    setDetails({})
  }

  return (
    <>
    <Modal open={open} onClose={onClose} className="max-w-md">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">{isEditing ? t('accountForm.edit') : t('accountForm.addAccount')} {t(ACCOUNT_TYPE_KEYS[type])}</h2>
          <div className="flex items-center gap-1">
            {isEditing && onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
                title="Delete account"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            )}
            <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="label mb-1.5 block dark:text-muted-foreground">{t('accountForm.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(ACCOUNT_TYPE_KEYS[type])}
              className="input"
              required
            />
          </div>

          {/* Subtype for cash */}
          {type === 'cash' && (
            <div>
              <label className="label mb-1.5 block dark:text-muted-foreground">{t('accountForm.accountType')}</label>
              <select value={subtype} onChange={(e) => setSubtype(e.target.value)} className="input">
                <option value="">{t('accountForm.selectType')}</option>
                {CASH_SUBTYPES.map(s => <option key={s.value} value={s.value}>{t(s.key)}</option>)}
              </select>
            </div>
          )}

          {/* Balance — hidden for gold (auto-calculated) */}
          {!isGold && (
            <div>
              <label className="label mb-1.5 block dark:text-muted-foreground">{isLiability ? t('accountForm.currentBalanceOwed') : t('accountForm.currentBalance')}</label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="input"
                required
              />
            </div>
          )}

          {/* Gold info */}
          {isGold && (
            <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3">
              <p className="text-xs text-yellow-800 dark:text-yellow-300">
                {t('accountForm.goldInfo')}
              </p>
            </div>
          )}

          {/* Currency */}
          <div>
            <label className="label mb-1.5 block dark:text-muted-foreground">{t('accountForm.currency')}</label>
            <CurrencyPicker value={currency} onChange={setCurrency} showType filter={currencyFilter} />
          </div>

          {/* Type-specific fields */}
          {type === 'property' && (
            <>
              <div>
                <label className="label mb-1.5 block dark:text-muted-foreground">{t('accountForm.address')}</label>
                <input type="text" value={details.address || ''} onChange={e => setDetails(d => ({ ...d, address: e.target.value }))} className="input" placeholder={t('accountForm.addressPlaceholder')} />
              </div>
              <div>
                <label className="label mb-1.5 block dark:text-muted-foreground">{t('accountForm.purchasePrice')}</label>
                <input type="number" value={details.purchase_price || ''} onChange={e => setDetails(d => ({ ...d, purchase_price: e.target.value }))} className="input" placeholder="0.00" step="0.01" />
              </div>
            </>
          )}

          {type === 'gold' && (
            <>
              <div>
                <label className="label mb-1.5 block dark:text-muted-foreground">{t('gold.weight')}</label>
                <input type="number" value={details.grams || ''} onChange={e => setDetails(d => ({ ...d, grams: e.target.value }))} className="input" placeholder="0.00" step="0.01" required />
              </div>
              <div>
                <label className="label mb-1.5 block dark:text-muted-foreground">{t('gold.karat')}</label>
                <select
                  value={details.karat || '18'}
                  onChange={e => {
                    const karat = e.target.value
                    const currencyMap: Record<string, string> = { '24': 'GOLD_GRAM24', '22': 'GOLD_GRAM22', '18': 'GOLD_GRAM18', '14': 'GOLD_GRAM18', '10': 'GOLD_GRAM18' }
                    setDetails(d => ({ ...d, karat }))
                    setCurrency(currencyMap[karat] || 'GOLD_GRAM18')
                  }}
                  className="input"
                >
                  <option value="24">24K (999 Fine)</option>
                  <option value="22">22K (916)</option>
                  <option value="18">18K (750)</option>
                  <option value="14">14K (585)</option>
                  <option value="10">10K (417)</option>
                </select>
              </div>
              <div>
                <label className="label mb-1.5 block dark:text-muted-foreground">{t('gold.purchasePrice')}</label>
                <input type="number" value={details.purchase_price_per_gram || ''} onChange={e => setDetails(d => ({ ...d, purchase_price_per_gram: e.target.value }))} className="input" placeholder="0.00" step="0.01" />
                <p className="text-xs text-muted-foreground mt-1">{t('gold.purchaseHint')}</p>
              </div>
            </>
          )}

          {type === 'vehicle' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-1.5 block dark:text-muted-foreground">{t('accountForm.make')}</label>
                  <input type="text" value={details.make || ''} onChange={e => setDetails(d => ({ ...d, make: e.target.value }))} className="input" placeholder="Toyota" />
                </div>
                <div>
                  <label className="label mb-1.5 block dark:text-muted-foreground">{t('accountForm.model')}</label>
                  <input type="text" value={details.model || ''} onChange={e => setDetails(d => ({ ...d, model: e.target.value }))} className="input" placeholder="Camry" />
                </div>
              </div>
              <div>
                <label className="label mb-1.5 block dark:text-muted-foreground">{t('accountForm.year')}</label>
                <input type="number" value={details.year || ''} onChange={e => setDetails(d => ({ ...d, year: e.target.value }))} className="input" placeholder="2024" />
              </div>
            </>
          )}

          {type === 'loan' && (
            <>
              <div>
                <label className="label mb-1.5 block dark:text-muted-foreground">{t('accountForm.interestRate')}</label>
                <input type="number" value={details.interest_rate || ''} onChange={e => setDetails(d => ({ ...d, interest_rate: e.target.value }))} className="input" placeholder="5.5" step="0.1" />
              </div>
              <div>
                <label className="label mb-1.5 block dark:text-muted-foreground">{t('accountForm.term')}</label>
                <input type="number" value={details.term || ''} onChange={e => setDetails(d => ({ ...d, term: e.target.value }))} className="input" placeholder="60" />
              </div>
            </>
          )}

          {type === 'credit_card' && (
            <div>
              <label className="label mb-1.5 block dark:text-muted-foreground">{t('accountForm.creditLimit')}</label>
              <input type="number" value={details.credit_limit || ''} onChange={e => setDetails(d => ({ ...d, credit_limit: e.target.value }))} className="input" placeholder="10000" step="0.01" />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{t('accountForm.cancel')}</button>
            <button type="submit" disabled={loading || !name} className="btn-primary flex-1">
              {loading ? (isEditing ? t('accountForm.saving') : t('accountForm.adding')) : (isEditing ? t('accountForm.saveChanges') : t('accountForm.addAccount'))}
            </button>
          </div>
        </form>
      </div>
    </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} className="max-w-sm">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{t('accountForm.deleteTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('accountForm.deleteDesc')}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-muted-foreground mb-6">
            {t('accountForm.deleteConfirm')} <strong className="dark:text-white">{account?.name}</strong>? {t('accountForm.deleteNote')}
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1">{t('accountForm.cancel')}</button>
            <button
              onClick={async () => {
                if (!onDelete || !account) return
                setDeleting(true)
                await onDelete(account.id)
                setDeleting(false)
                setShowDeleteConfirm(false)
                onClose()
              }}
              disabled={deleting}
              className="flex-1 rounded-xl px-4 py-2.5 bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? t('accountForm.deleting') : t('accountForm.delete')}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
