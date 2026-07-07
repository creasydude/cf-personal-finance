import { useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { cn } from '../lib/utils'

interface LayoutProps {
  children: ReactNode
  userCode: string | null
  onLogout: () => void
}

export function Layout({ children, userCode, onLogout }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const initials = userCode ? userCode.substring(0, 2) : '??'

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <main
        className={cn(
          'transition-all duration-300 min-h-screen',
          collapsed ? 'ml-[68px]' : 'ml-[220px]'
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-sm px-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="text-gray-900 font-medium">Home</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="btn-ghost text-sm"
            >
              Sign Out
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
