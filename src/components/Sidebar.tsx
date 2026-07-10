import { NavLink } from 'react-router-dom'
import { cn } from '../lib/utils'
import { useTranslation } from '../hooks/useTranslation'
import { Home, ArrowLeftRight, BarChart3, Tag, PanelLeftClose, PanelLeft } from 'lucide-react'

function useNavItems(t: (k: string) => string) {
  return [
    { to: '/', label: t('nav.home'), icon: <Home className="h-5 w-5" /> },
    { to: '/transactions', label: t('nav.transactions'), icon: <ArrowLeftRight className="h-5 w-5" /> },
    { to: '/budgets', label: t('nav.budgets'), icon: <BarChart3 className="h-5 w-5" /> },
    { to: '/categories', label: t('nav.categories'), icon: <Tag className="h-5 w-5" /> },
  ]
}

export function Sidebar({ collapsed, onToggle, settings }: { collapsed: boolean; onToggle: () => void; settings?: Record<string, any> }) {
  const { t } = useTranslation(settings || {})
  const navItems = useNavItems(t)
  const isRTL = settings?.language === 'fa'
  return (
    <aside
      className={cn(
        'fixed top-0 z-40 flex h-screen flex-col border-border bg-card transition-all duration-300',
        isRTL ? 'right-0 border-l' : 'left-0 border-r',
        collapsed ? 'w-[68px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-md shadow-primary/25">
          <span className="text-sm font-bold text-primary-foreground">F</span>
        </div>
        {!collapsed && (
          <span className="text-base font-bold text-foreground">{t('sidebar.finance')}</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center px-2'
              )
            }
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-3 space-y-1">
        <button
          onClick={onToggle}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title={collapsed ? t('nav.expand') : t('nav.collapse')}
        >
          {collapsed || (!collapsed && isRTL) ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
          {!collapsed && <span>{t('nav.collapse')}</span>}
        </button>
      </div>
    </aside>
  )
}
