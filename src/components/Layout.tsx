import { useState, useRef, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useTranslation } from '../hooks/useTranslation'
import { cn } from '../lib/utils'
import { ChevronRight, Settings, LogOut, Copy, Check } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
  userCode: string | null
  settings: Record<string, any>
  onLogout: () => void
}

export function Layout({ children, userCode, settings, onLogout }: LayoutProps) {
  const { t, isRTL } = useTranslation(settings)
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const nickname = settings?.nickname || ''
  const initials = nickname ? nickname.charAt(0).toUpperCase() : userCode ? userCode.substring(0, 2) : '??'

  const handleCopyCode = async () => {
    if (!userCode) return
    await navigator.clipboard.writeText(userCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} settings={settings} />

      <main
        className={cn(
          'transition-all duration-300 min-h-screen',
          isRTL
            ? (collapsed ? 'mr-[68px]' : 'mr-[220px]')
            : (collapsed ? 'ml-[68px]' : 'ml-[220px]')
        )}
      >
        {/* Top bar */}
        <header dir={isRTL ? 'rtl' : 'ltr'} className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-foreground font-medium">{t('nav.home')}</span>
            <ChevronRight className="h-4 w-4" />
            <span>{t('nav.home')}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* User avatar dropdown */}
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary hover:bg-primary/20 transition-colors cursor-pointer overflow-hidden"
              >
                {settings?.photo ? (
                  <img src={settings.photo} alt="Avatar" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  initials
                )}
              </button>

              {menuOpen && (
                <div className="absolute end-0 top-full mt-2 w-56 rounded-xl border border-border bg-popover py-1 shadow-lg animate-slide-down z-50">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs text-muted-foreground">{t('auth.signedInAs')}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground font-mono truncate">{userCode}</p>
                      <button
                        onClick={handleCopyCode}
                        className="flex-shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        title="Copy code"
                      >
                        {codeCopied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => { navigate('/settings'); setMenuOpen(false) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    {t('nav.settings')}
                  </button>
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={() => { onLogout(); setMenuOpen(false) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('nav.signOut')}
                  </button>
                </div>
              )}
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
