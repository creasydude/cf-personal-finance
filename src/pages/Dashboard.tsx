import { useState, useMemo } from 'react'
import { AnimatedNumber } from '../components/ui/animated-number'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { NetWorthChart } from '../components/NetWorthChart'
import { SegmentedBar } from '../components/SegmentedBar'
import { useTranslation } from '../hooks/useTranslation'
import { AccountTypeModal } from '../components/AccountTypeModal'
import { AccountForm } from '../components/AccountForm'
import { Dropdown, DropdownItem } from '../components/ui/dropdown'
import { formatCurrency, formatPercent } from '../lib/utils'
import { useAccounts } from '../hooks/useAccounts'
import { useNetWorth } from '../hooks/useNetWorth'
import { Plus, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react'
import type { AccountType } from '../types'

const RANGE_OPTIONS = [
  { key: 'range.30d', value: '30d' },
  { key: 'range.90d', value: '90d' },
  { key: 'range.1y', value: '1y' },
  { key: 'range.all', value: 'all' },
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
  const { t, locale, isRTL } = useTranslation(settings)
  const { accounts, assetsTotal, liabilitiesTotal, loading: accountsLoading, createAccount, updateAccount, deleteAccount } = useAccounts()
  const { data: netWorth, range, setRange, loading: nwLoading, refetch: refetchNetWorth } = useNetWorth()
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [typeModalOpen, setTypeModalOpen] = useState(false)
  const [accountFormType, setAccountFormType] = useState<AccountType | null>(null)
  const [editingAccount, setEditingAccount] = useState<any>(null)

  const baseCurrency = netWorth?.base_currency || settings?.baseCurrency || 'IRR'
  const netWorthValue = netWorth?.current ?? (assetsTotal - liabilitiesTotal)
  const changePct = netWorth?.change_pct || 0

  const displayAccounts = useMemo(() => {
    const assetTypes = ['cash', 'investment', 'crypto', 'gold', 'property', 'vehicle', 'other_asset']
    const liabilityTypes = ['credit_card', 'loan', 'other_liability']
    if (activeTab === 'assets') return accounts.filter(a => assetTypes.includes(a.type))
    if (activeTab === 'debts') return accounts.filter(a => liabilityTypes.includes(a.type))
    return accounts
  }, [accounts, activeTab])

  const segments = useMemo(() => {
    return netWorth?.by_type?.map((item: any) => {
      const typeKey = `account.${item.type === 'other_asset' ? 'otherAsset' : item.type === 'other_liability' ? 'otherLiability' : item.type === 'credit_card' ? 'creditCard' : item.type}`
      return {
        label: t(typeKey) || item.label,
        value: Math.abs(item.value),
        color: TYPE_COLORS[item.type] || 'bg-gray-400',
      }
    }) || []
  }, [netWorth, locale])

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('dashboard.welcome')}{settings?.nickname ? `, ${settings.nickname}` : userCode ? `, ${userCode}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('dashboard.overview')}</p>
        </div>
        <Button onClick={() => setTypeModalOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('dashboard.new')}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
        <TabsList>
          {(['all', 'assets', 'debts'] as Tab[]).map(tab => (
            <TabsTrigger key={tab} value={tab}>{t(`tab.${tab}`)}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_1fr]">
        {/* Left: Account list */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">{t('dashboard.accounts')}</h3>
          {displayAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t('dashboard.noAccounts')}</p>
          ) : (
            displayAccounts.map(account => (
              <div
                key={account.id}
                onClick={() => handleEditAccount(account)}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors"
              >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${TYPE_COLORS[account.type] || 'bg-gray-400'}`}>
                  <span className="text-white text-xs font-bold">
                    {account.type.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{account.name}</p>
                  <p className="text-xs text-muted-foreground">{account.currency}</p>
                </div>
                <div className="text-end">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(account.balance, account.currency, locale)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Main content */}
        <div className="space-y-6">
          {/* Net Worth Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('dashboard.netWorth')}</p>
                  <div className="mt-1 flex items-baseline gap-4">
                    <AnimatedNumber
                      value={netWorthValue}
                      format={(v) => formatCurrency(v, baseCurrency, locale)}
                      className="text-3xl font-bold tracking-tight text-foreground"
                    />
                    <Badge variant={changePct >= 0 ? 'success' : 'destructive'}>
                      {changePct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {formatPercent(changePct)}
                    </Badge>
                  </div>
                </div>

                <Dropdown
                  trigger={
                    <Button variant="outline" size="sm">
                      {t(RANGE_OPTIONS.find(r => r.value === range)?.key || 'range.all')}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  }
                  align="right"
                >
                  {RANGE_OPTIONS.map(opt => (
                    <DropdownItem key={opt.value} onClick={() => setRange(opt.value)}>
                      {t(opt.key)}
                    </DropdownItem>
                  ))}
                </Dropdown>
              </div>

              <NetWorthChart data={netWorth?.history || []} baseCurrency={baseCurrency} locale={locale} />
            </CardContent>
          </Card>

          {/* Assets Breakdown */}
          {segments.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">{t('dashboard.assetsBreakdown')}</h3>
                <SegmentedBar segments={segments} total={segments.reduce((s: number, seg: any) => s + seg.value, 0) || 1} />

                <div className="mt-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('account.name')}</th>
                        <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('table.weight')}</th>
                        <th className="pb-3 text-end text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('table.amount')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const typeValues = netWorth?.by_type?.filter((item: any) => item.value > 0) || []
                        const totalByType = typeValues.reduce((sum: number, item: any) => sum + Math.abs(item.value), 0)
                        return typeValues.map((item: any) => {
                          const pct = totalByType > 0 ? (Math.abs(item.value) / totalByType) * 100 : 0
                          const typeKey = `account.${item.type === 'other_asset' ? 'otherAsset' : item.type === 'other_liability' ? 'otherLiability' : item.type === 'credit_card' ? 'creditCard' : item.type}`
                          return (
                            <tr key={item.type} className="border-b border-border/50 last:border-0">
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className={`h-2.5 w-2.5 rounded-full ${TYPE_COLORS[item.type] || 'bg-gray-400'}`} />
                                  <span className="text-sm text-muted-foreground">{t(typeKey) || item.label}</span>
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-sm font-medium text-foreground w-12 text-end">{pct.toFixed(1)}%</span>
                                  <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${TYPE_COLORS[item.type] || 'bg-gray-400'}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 text-end">
                                <span className="text-sm font-semibold text-foreground">{formatCurrency(Math.abs(item.value), baseCurrency, locale)}</span>
                              </td>
                            </tr>
                          )
                        })
                      })()}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
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
          onDelete={async (id) => {
            await deleteAccount(id)
            refetchNetWorth()
            setEditingAccount(null)
            setAccountFormType(null)
          }}
        />
      )}
    </div>
  )
}
