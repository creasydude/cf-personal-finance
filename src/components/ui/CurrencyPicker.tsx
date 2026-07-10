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
          <span className="text-muted-foreground">{selected?.symbol}</span>
          <span className="font-medium text-foreground">{selected?.name || selected?.code}</span>
        </span>
        <svg className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg max-h-[300px] overflow-hidden animate-slide-down">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search currencies..."
              className="w-full rounded-lg border-0 bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[250px]">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No currencies found</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onChange(c.code); setOpen(false); setSearch('') }}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent transition-colors',
                    c.code === value && 'bg-primary/10 text-primary'
                  )}
                >
                  <span className="w-6 text-center text-muted-foreground">{c.symbol}</span>
                  <span className="font-medium flex-1 text-foreground">{c.name}</span>
                  {showType && (
                    <span className={cn(
                      'text-[10px] font-medium px-1.5 py-0.5 rounded',
                      c.type === 'crypto' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      c.type === 'gold' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
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
