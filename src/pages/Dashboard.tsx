import { useState, useMemo } from 'react'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { Badge } from '../components/ui/Badge'
import { NetWorthChart } from '../components/NetWorthChart'
import { SegmentedBar } from '../components/SegmentedBar'
import { AccountTypeModal } from '../components/AccountTypeModal'
import { AccountForm } from '../components/AccountForm'
import { Dropdown, DropdownItem } from '../components/ui/Dropdown'
import { formatCurrency, formatPercent } from '../lib/utils'
import { useAccounts } from '../hooks/useAccounts'
import { useNetWorth } from '../hooks/useNetWorth'
import type { AccountType } from '../types'

const RANGE_OPTIONS = [
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: '1Y', value: '1y' },
  { label: 'ALL', value: 'all' },
]

const TYPE_COLORS: Record<string, string> = {
  cash: 'bg-emerald-500',
  investment: 'bg-blue-500',
  crypto: 'bg-amber-500',
  gold: 'bg-yellow-500',
  property: 'bg-teal-500',
  vehicle: 'bg-gray-400',
  other_asset: 'bg-indigo-400',
  credit_card: 'bg-rose-500',
  loan: 'bg-orange-500',
  other_liability: 'bg-slate-500',
}

type Tab = 'all' | 'assets' | 'debts'

export function Dashboard({ userCode, settings }: { userCode: string | null; settings: Record<string, any> }) {
  const { accounts, assetsTotal, liabilitiesTotal, loading: accountsLoading, createAccount, updateAccount, deleteAccount } = useAccounts()
  const { data: netWorth, range, setRange, loading: nwLoading, refetch: refetchNetWorth } = useNetWorth()
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [typeModalOpen, setTypeModalOpen] = useState(false)
  const [accountFormType, setAccountFormType] = useState<AccountType | null>(null)
  const [editingAccount, setEditingAccount] = useState<any>(null)

  const baseCurrency = netWorth?.base_currency || settings?.baseCurrency || 'IRR'
  const netWorthValue = netWorth?.current ?? (assetsTotal - liabilitiesTotal)
  const changePct = netWorth?.change_pct || 0
  const changeValue = netWorth?.change || 0

  const displayAccounts = useMemo(() => {
    const assetTypes = ['cash', 'investment', 'crypto', 'gold', 'property', 'vehicle', 'other_asset']
    const liabilityTypes = ['credit_card', 'loan', 'other_liability']
    if (activeTab === 'assets') return accounts.filter(a => assetTypes.includes(a.type))
    if (activeTab === 'debts') return accounts.filter(a => liabilityTypes.includes(a.type))
    return accounts
  }, [accounts, activeTab])

  const segments = useMemo(() => {
    return netWorth?.by_type?.map((t: any) => ({
      label: t.label,
      value: Math.abs(t.value),
      color: TYPE_COLORS[t.type] || 'bg-gray-400',
    })) || []
  }, [netWorth])

  const handleAccountTypeSelect = (type: AccountType) => {
    setTypeModalOpen(false)
    setAccountFormType(type)
    setEditingAccount(null)
  }

  const handleEditAccount = (account: any) => {
    setEditingAccount(account)
    setAccountFormType(account.type)
  }

  const handleAccountSubmit = async (data: any) => {
    if (editingAccount) {
      await updateAccount(editingAccount.id, data)
    } else {
      await createAccount(data)
    }
    refetchNetWorth()
    setEditingAccount(null)
    setAccountFormType(null)
  }

  if (accountsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{settings?.nickname ? `, ${settings.nickname}` : userCode ? `, ${userCode}` : ''}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Here's your financial overview</p>
        </div>
        <button onClick={() => setTypeModalOpen(true)} className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        {(['all', 'assets', 'debts'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_1fr]">
        {/* Left: Account list */}
        <div className="space-y-2">
          <h3 className="label px-1">Accounts</h3>
          {displayAccounts.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No accounts yet. Click "+ New" to add one.</p>
          ) : (
            displayAccounts.map(account => (
              <div
                key={account.id}
                onClick={() => handleEditAccount(account)}
                className="card-hover flex items-center gap-3 p-3 cursor-pointer group"
              >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${TYPE_COLORS[account.type] || 'bg-gray-400'}`}>
                  <span className="text-white text-xs font-bold">
                    {account.type.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{account.name}</p>
                  <p className="text-xs text-gray-500">{account.currency}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(account.balance, account.currency)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Main content */}
        <div className="space-y-6">
          {/* Net Worth Card */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="stat-label">Net Worth</p>
                <div className="mt-1 flex items-baseline gap-3">
                  <AnimatedNumber
                    value={netWorthValue}
                    format={(v) => formatCurrency(v, baseCurrency)}
                    className="stat-value"
                  />
                  <Badge variant={changePct >= 0 ? 'success' : 'danger'}>
                    {changePct >= 0 ? '↑' : '↓'} {formatPercent(changePct)}
                  </Badge>
                </div>
              </div>

              <Dropdown
                trigger={
                  <button className="btn-secondary text-xs">
                    {RANGE_OPTIONS.find(r => r.value === range)?.label}
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                }
                align="right"
              >
                {RANGE_OPTIONS.map(opt => (
                  <DropdownItem key={opt.value} onClick={() => setRange(opt.value)}>
                    {opt.label}
                  </DropdownItem>
                ))}
              </Dropdown>
            </div>

            <NetWorthChart data={netWorth?.history || []} baseCurrency={baseCurrency} />
          </div>

          {/* Assets Breakdown */}
          {segments.length > 0 && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Assets Breakdown</h3>
              <SegmentedBar segments={segments} total={segments.reduce((s: number, seg: any) => s + seg.value, 0) || 1} />

              {/* Data table */}
              <div className="mt-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 text-left label">Name</th>
                      <th className="pb-3 text-right label">Weight</th>
                      <th className="pb-3 text-right label">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {netWorth?.by_type?.filter((t: any) => t.value > 0).map((t: any) => {
                      const pct = assetsTotal > 0 ? (Math.abs(t.value) / assetsTotal) * 100 : 0
                      return (
                        <tr key={t.type} className="border-b border-gray-50 last:border-0">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className={`h-2.5 w-2.5 rounded-full ${TYPE_COLORS[t.type] || 'bg-gray-400'}`} />
                              <span className="text-sm text-gray-700">{t.label}</span>
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${TYPE_COLORS[t.type] || 'bg-gray-400'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900 w-12 text-right">{pct.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(Math.abs(t.value), baseCurrency)}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AccountTypeModal
        open={typeModalOpen}
        onClose={() => setTypeModalOpen(false)}
        onSelect={handleAccountTypeSelect}
      />

      {accountFormType && (
        <AccountForm
          open={!!accountFormType}
          type={accountFormType}
          account={editingAccount}
          onClose={() => { setAccountFormType(null); setEditingAccount(null) }}
          onSubmit={handleAccountSubmit}
        />
      )}
    </div>
  )
}
