import { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { CurrencyPicker } from './ui/CurrencyPicker'
import type { AccountType } from '../types'

interface AccountFormProps {
  open: boolean
  type: AccountType
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  account?: any // for edit mode
}

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Cash Account',
  investment: 'Investment Account',
  crypto: 'Crypto Wallet',
  gold: 'Gold',
  property: 'Property',
  vehicle: 'Vehicle',
  credit_card: 'Credit Card',
  loan: 'Loan',
  other_asset: 'Other Asset',
  other_liability: 'Other Liability',
}

const CASH_SUBTYPES = ['Checking', 'Savings', 'Cash', 'Other']

export function AccountForm({ open, type, onClose, onSubmit, account }: AccountFormProps) {
  const isEditing = !!account
  const [loading, setLoading] = useState(false)
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
    <Modal open={open} onClose={onClose} className="max-w-md">
      <div className="rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">{isEditing ? 'Edit' : 'Add'} {ACCOUNT_TYPE_LABELS[type]}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="label mb-1.5 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={ACCOUNT_TYPE_LABELS[type]}
              className="input"
              required
            />
          </div>

          {/* Subtype for cash */}
          {type === 'cash' && (
            <div>
              <label className="label mb-1.5 block">Account Type</label>
              <select value={subtype} onChange={(e) => setSubtype(e.target.value)} className="input">
                <option value="">Select type...</option>
                {CASH_SUBTYPES.map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Balance — hidden for gold (auto-calculated) */}
          {!isGold && (
            <div>
              <label className="label mb-1.5 block">{isLiability ? 'Current Balance (owed)' : 'Current Balance'}</label>
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
            <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3">
              <p className="text-xs text-yellow-800">
                Gold value is automatically calculated using live gold prices from the API based on weight and karat.
              </p>
            </div>
          )}

          {/* Currency */}
          <div>
            <label className="label mb-1.5 block">Currency</label>
            <CurrencyPicker value={currency} onChange={setCurrency} showType filter={currencyFilter} />
          </div>

          {/* Type-specific fields */}
          {type === 'property' && (
            <>
              <div>
                <label className="label mb-1.5 block">Address</label>
                <input type="text" value={details.address || ''} onChange={e => setDetails(d => ({ ...d, address: e.target.value }))} className="input" placeholder="123 Main St, City" />
              </div>
              <div>
                <label className="label mb-1.5 block">Purchase Price</label>
                <input type="number" value={details.purchase_price || ''} onChange={e => setDetails(d => ({ ...d, purchase_price: e.target.value }))} className="input" placeholder="0.00" step="0.01" />
              </div>
            </>
          )}

          {type === 'gold' && (
            <>
              <div>
                <label className="label mb-1.5 block">Weight (grams)</label>
                <input type="number" value={details.grams || ''} onChange={e => setDetails(d => ({ ...d, grams: e.target.value }))} className="input" placeholder="0.00" step="0.01" required />
              </div>
              <div>
                <label className="label mb-1.5 block">Karat</label>
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
                <label className="label mb-1.5 block">Purchase Price per Gram (optional)</label>
                <input type="number" value={details.purchase_price_per_gram || ''} onChange={e => setDetails(d => ({ ...d, purchase_price_per_gram: e.target.value }))} className="input" placeholder="0.00" step="0.01" />
                <p className="text-xs text-gray-400 mt-1">Used to calculate profit/loss</p>
              </div>
            </>
          )}

          {type === 'vehicle' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-1.5 block">Make</label>
                  <input type="text" value={details.make || ''} onChange={e => setDetails(d => ({ ...d, make: e.target.value }))} className="input" placeholder="Toyota" />
                </div>
                <div>
                  <label className="label mb-1.5 block">Model</label>
                  <input type="text" value={details.model || ''} onChange={e => setDetails(d => ({ ...d, model: e.target.value }))} className="input" placeholder="Camry" />
                </div>
              </div>
              <div>
                <label className="label mb-1.5 block">Year</label>
                <input type="number" value={details.year || ''} onChange={e => setDetails(d => ({ ...d, year: e.target.value }))} className="input" placeholder="2024" />
              </div>
            </>
          )}

          {type === 'loan' && (
            <>
              <div>
                <label className="label mb-1.5 block">Interest Rate (%)</label>
                <input type="number" value={details.interest_rate || ''} onChange={e => setDetails(d => ({ ...d, interest_rate: e.target.value }))} className="input" placeholder="5.5" step="0.1" />
              </div>
              <div>
                <label className="label mb-1.5 block">Term (months)</label>
                <input type="number" value={details.term || ''} onChange={e => setDetails(d => ({ ...d, term: e.target.value }))} className="input" placeholder="60" />
              </div>
            </>
          )}

          {type === 'credit_card' && (
            <div>
              <label className="label mb-1.5 block">Credit Limit</label>
              <input type="number" value={details.credit_limit || ''} onChange={e => setDetails(d => ({ ...d, credit_limit: e.target.value }))} className="input" placeholder="10000" step="0.01" />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading || !name} className="btn-primary flex-1">
              {loading ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Account')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
