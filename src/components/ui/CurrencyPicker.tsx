import { useState, useRef, useEffect } from 'react'
import { CURRENCIES } from '../../lib/currencies'
import { cn } from '../../lib/utils'

interface CurrencyPickerProps {
  value: string
  onChange: (code: string) => void
  className?: string
  showType?: boolean // show "fiat"/"crypto" badge
  filter?: 'fiat' | 'crypto' | 'gold' // only show currencies of this type
}

export function CurrencyPicker({ value, onChange, className, showType = false, filter }: CurrencyPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = CURRENCIES.filter(c => {
    if (filter && c.type !== filter) return false
    const q = search.toLowerCase()
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
    )
  })

  const selected = CURRENCIES.find(c => c.code === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 50) }}
        className="input flex items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400">{selected?.symbol}</span>
          <span className="font-medium dark:text-white">{selected?.code}</span>
          <span className="text-gray-400 dark:text-gray-500 text-xs truncate">{selected?.name}</span>
        </span>
        <svg className={cn('h-4 w-4 text-gray-400 transition-transform', open && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg max-h-[300px] overflow-hidden animate-slide-down">
          {/* Search */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search currencies..."
              className="w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[250px]">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No currencies found</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onChange(c.code); setOpen(false); setSearch('') }}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                    c.code === value && 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400'
                  )}
                >
                  <span className="w-6 text-center text-gray-500 dark:text-gray-400">{c.symbol}</span>
                  <span className="font-medium min-w-[40px] dark:text-white">{c.code}</span>
                  <span className="text-gray-500 dark:text-gray-400 truncate flex-1">{c.name}</span>
                  {showType && (
                    <span className={cn(
                      'text-[10px] font-medium px-1.5 py-0.5 rounded',
                      c.type === 'crypto' ? 'bg-amber-50 text-amber-700' :
                      c.type === 'gold' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-blue-50 text-blue-700'
                    )}>
                      {c.type}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
