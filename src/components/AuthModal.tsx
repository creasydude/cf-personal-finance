import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { cn } from '../lib/utils'
import { useTranslation } from '../hooks/useTranslation'
import { Logo } from './ui/logo'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent } from './ui/card'
import { ArrowRight, Shield, BarChart3, Wallet, Check, Copy, Loader2, Globe } from 'lucide-react'

interface AuthModalProps {
  open: boolean
  onLogin: (code: string) => Promise<{ requires2FA?: boolean } | void>
  onRegister: () => Promise<string>
  pending2FA?: { code: string } | null
  onLoginWith2FA?: (totp: string) => Promise<void>
  onCancel2FA?: () => void
}

type ModalView = 'login' | 'register' | 'code-reveal' | 'totp'

const FEATURES = [
  { icon: <Wallet className="h-5 w-5" />, key: 'auth.feature1' },
  { icon: <BarChart3 className="h-5 w-5" />, key: 'auth.feature2' },
  { icon: <Shield className="h-5 w-5" />, key: 'auth.feature3' },
]

export function AuthModal({ open, onLogin, onRegister, pending2FA, onLoginWith2FA, onCancel2FA }: AuthModalProps) {
  const { t } = useTranslation()
  const [view, setView] = useState<ModalView>('login')
  const [code, setCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const totpRef = useRef<HTMLInputElement>(null)

  const currentLang = localStorage.getItem('language') || 'fa'

  const toggleLanguage = () => {
    const newLang = currentLang === 'fa' ? 'en' : 'fa'
    localStorage.setItem('language', newLang)
    window.location.reload()
  }

  useEffect(() => {
    if (pending2FA) {
      setView('totp')
      setError('')
      setTimeout(() => totpRef.current?.focus(), 100)
    }
  }, [pending2FA])

  useEffect(() => {
    if (view === 'login' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [view])

  const formatCode = (value: string) => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (cleaned.length <= 4) return cleaned
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(formatCode(e.target.value))
    setError('')
  }

  const handleLogin = async () => {
    if (code.length < 9) {
      setError(t('auth.invalidCode'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await onLogin(code)
      if (result && 'requires2FA' in result && result.requires2FA) return
    } catch (err: any) {
      setError(err.message || t('auth.invalidCodeError'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2FA = async () => {
    if (totpCode.length !== 6) {
      setError(t('auth.invalidCode'))
      return
    }
    setLoading(true)
    setError('')
    try {
      await onLoginWith2FA?.(totpCode)
    } catch (err: any) {
      setError(err.message || t('auth.invalidCodeError'))
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    setLoading(true)
    setError('')
    try {
      const newCode = await onRegister()
      setGeneratedCode(newCode)
      setView('code-reveal')
    } catch (err: any) {
      setError(err.message || t('auth.failedToCreate'))
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && view === 'login') handleLogin()
    if (e.key === 'Enter' && view === 'totp') handleVerify2FA()
  }

  return (
    <div className="min-h-screen bg-background flex" dir={currentLang === 'fa' ? 'rtl' : 'ltr'}>
      {/* Left: Branding panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/5 to-background">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM4YjVjZjYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTR2Mkg4djJoMTJ6bTAgLTR2Mkg4djJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <div className="mb-8">
            <Logo size="lg" />
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold text-foreground mb-4">
            {t('auth.brandTitle')}
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md">
            {t('auth.brandSubtitle')}
          </p>
          <div className="space-y-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {f.icon}
                </div>
                <span className="text-sm text-muted-foreground">{t(f.key)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size="lg" />
          </div>

          {/* Login View */}
          {view === 'login' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{t('auth.welcome')}</h2>
                <p className="text-muted-foreground mt-1">{t('auth.enterCode')}</p>
              </div>

              <div className="space-y-4">
                <Input
                  ref={inputRef}
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  onKeyDown={handleKeyDown}
                  placeholder="XXXX-XXXX"
                  maxLength={9}
                  autoComplete="off"
                  spellCheck={false}
                  className={cn(
                    'h-12 text-center font-mono text-xl tracking-[0.2em]',
                    error && 'border-destructive focus-visible:ring-destructive'
                  )}
                />
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
              </div>

              <Button
                onClick={handleLogin}
                disabled={loading || code.length < 9}
                className="w-full h-11 text-base"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> {t('auth.loggingIn')}</>
                ) : (
                  <>{t('auth.login')} <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t('auth.dontHaveCode')}{' '}
                <button onClick={() => setView('register')} className="text-primary hover:text-primary/80 font-medium">
                  {t('auth.register')}
                </button>
              </p>

              <div className="flex justify-center pt-2">
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {currentLang === 'fa' ? 'English' : 'فارسی'}
                </button>
              </div>
            </div>
          )}

          {/* Register View */}
          {view === 'register' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{t('auth.createAccount')}</h2>
                <p className="text-muted-foreground mt-1">{t('auth.codeHint')}</p>
              </div>

              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-4">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>{t('auth.important')}:</strong> {t('auth.saveWarning')}
                </p>
              </div>

              <Button
                onClick={handleRegister}
                disabled={loading}
                className="w-full h-11 text-base"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> {t('auth.generating')}</>
                ) : (
                  t('auth.generateCode')
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t('auth.alreadyHaveCode')}{' '}
                <button onClick={() => { setView('login'); setError('') }} className="text-primary hover:text-primary/80 font-medium">
                  {t('auth.login')}
                </button>
              </p>

              <div className="flex justify-center pt-2">
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {currentLang === 'fa' ? 'English' : 'فارسی'}
                </button>
              </div>
            </div>
          )}

          {/* Code Reveal View */}
          {view === 'code-reveal' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <Check className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t('auth.savedCode')}</h2>
                <p className="text-muted-foreground mt-1">{t('auth.codeRevealSaveWarning')}</p>
              </div>

              <div className="relative">
                <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center">
                  <p className="font-mono text-3xl font-bold tracking-[0.15em] text-primary">
                    {generatedCode}
                  </p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="absolute end-2 top-2 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  title={t('auth.copyToClipboard')}
                >
                  {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>

              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                <p className="text-sm text-destructive text-center">
                  <strong>{t('auth.saveWarning')}</strong> {t('auth.codeRevealWarning')}
                </p>
              </div>

              <Button onClick={() => onLogin(generatedCode)} className="w-full h-11 text-base">
                {t('auth.copiedSaved')}
              </Button>
            </div>
          )}

          {/* 2FA Verification View */}
          {view === 'totp' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t('auth.twoFactorVerify')}</h2>
                <p className="text-muted-foreground mt-1">{t('auth.twoFactorVerifyHint')}</p>
              </div>

              <Input
                ref={totpRef}
                type="text"
                value={totpCode}
                onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                onKeyDown={handleKeyDown}
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                className={cn(
                  'h-12 text-center font-mono text-2xl tracking-[0.3em]',
                  error && 'border-destructive focus-visible:ring-destructive'
                )}
              />
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button
                onClick={handleVerify2FA}
                disabled={loading || totpCode.length !== 6}
                className="w-full h-11 text-base"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> {t('auth.verifying')}</>
                ) : (
                  t('auth.verify')
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                <button
                  onClick={() => { onCancel2FA?.(); setView('login'); setTotpCode(''); setError('') }}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  {t('account.cancel')}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
