import { useState, useEffect, useRef, useCallback } from 'react'
import { Modal } from './ui/Modal'
import { cn } from '../lib/utils'
import { useTranslation } from '../hooks/useTranslation'
import type { AccountType } from '../types'

interface AccountTypeModalProps {
  open: boolean
  onClose: () => void
  onSelect: (type: AccountType) => void
}

interface AccountOption {
  type: AccountType
  label: string
  icon: React.ReactNode
  color: string
  section: 'asset' | 'liability' | 'utility'
}

const accountOptions: AccountOption[] = [
  // Assets
  {
    type: 'cash',
    label: 'account.cash',
    color: 'bg-emerald-500',
    section: 'asset',
    icon: (
      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    type: 'investment',
    label: 'account.investment',
    color: 'bg-blue-500',
    section: 'asset',
    icon: (
      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    type: 'crypto',
    label: 'account.crypto',
    color: 'bg-amber-500',
    section: 'asset',
    icon: (
      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
  },
  {
    type: 'gold',
    label: 'account.gold',
    color: 'bg-yellow-500',
    section: 'asset',
    icon: (
      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 21v-3.75m15 3.75v-3.75M4.5 15h15" />
      </svg>
    ),
  },
  {
    type: 'property',
    label: 'account.property',
    color: 'bg-teal-500',
    section: 'asset',
    icon: (
      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    type: 'vehicle',
    label: 'account.vehicle',
    color: 'bg-gray-500',
    section: 'asset',
    icon: (
      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    type: 'other_asset',
    label: 'account.otherAsset',
    color: 'bg-indigo-400',
    section: 'asset',
    icon: (
      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  // Liabilities
  {
    type: 'credit_card',
    label: 'account.creditCard',
    color: 'bg-rose-500',
    section: 'liability',
    icon: (
      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    type: 'loan',
    label: 'account.loan',
    color: 'bg-orange-500',
    section: 'liability',
    icon: (
      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    type: 'other_liability',
    label: 'account.otherLiability',
    color: 'bg-slate-500',
    section: 'liability',
    icon: (
      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
      </svg>
    ),
  },
]

export function AccountTypeModal({ open, onClose, onSelect }: AccountTypeModalProps) {
  const { t } = useTranslation()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const assets = accountOptions.filter(o => o.section === 'asset')
  const liabilities = accountOptions.filter(o => o.section === 'liability')

  const allItems = [...assets, ...liabilities]

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => (i + 1) % allItems.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => (i - 1 + allItems.length) % allItems.length)
        break
      case 'Enter':
        e.preventDefault()
        onSelect(allItems[selectedIndex].type)
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [allItems, selectedIndex, onSelect, onClose])

  useEffect(() => {
    setSelectedIndex(0)
  }, [open])

  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement
      selected?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg">
      <div
        className="rounded-2xl bg-[#171717] shadow-2xl overflow-hidden"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-lg font-bold text-white">{t('accountTypeModal.title')}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Options list */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto px-3 pb-3">
          {/* Assets */}
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">{t('accountTypeModal.assets')}</p>
          {assets.map((opt, i) => (
            <OptionRow
              key={opt.type + opt.label}
              option={opt}
              selected={selectedIndex === i}
              onClick={() => onSelect(opt.type)}
              onMouseEnter={() => setSelectedIndex(i)}
            />
          ))}

          {/* Liabilities */}
          <p className="px-3 py-2 mt-2 text-xs font-semibold uppercase tracking-wider text-gray-500">{t('accountTypeModal.liabilities')}</p>
          {liabilities.map((opt, i) => {
            const idx = assets.length + i
            return (
              <OptionRow
                key={opt.type + opt.label}
                option={opt}
                selected={selectedIndex === idx}
                onClick={() => onSelect(opt.type)}
                onMouseEnter={() => setSelectedIndex(idx)}
              />
            )
          })}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 border-t border-white/10 px-6 py-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
            {t('accountTypeModal.selectHint')}
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
            {t('accountTypeModal.navigateHint')}
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">ESC</kbd>
            {t('accountTypeModal.closeHint')}
          </span>
        </div>
      </div>
    </Modal>
  )
}

function OptionRow({
  option,
  selected,
  onClick,
  onMouseEnter,
}: {
  option: AccountOption
  selected: boolean
  onClick: () => void
  onMouseEnter: () => void
}) {
  const { t } = useTranslation()
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
        selected ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5'
      )}
    >
      <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg', option.color)}>
        {option.icon}
      </div>
      <span className="text-sm font-medium">{t(option.label)}</span>
    </button>
  )
}
