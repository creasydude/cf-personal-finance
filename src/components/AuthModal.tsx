import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Modal } from './ui/Modal'
import { cn } from '../lib/utils'
import { useTranslation } from '../hooks/useTranslation'

interface AuthModalProps {
  open: boolean
  onLogin: (code: string) => Promise<void>
  onRegister: () => Promise<string>
}

type ModalView = 'login' | 'register' | 'code-reveal'

export function AuthModal({ open, onLogin, onRegister }: AuthModalProps) {
  const { t } = useTranslation()
  const [view, setView] = useState<ModalView>('login')
  const [code, setCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
      await onLogin(code)
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
    if (e.key === 'Enter' && view === 'login') {
      handleLogin()
    }
  }

  return (
    <Modal open={open} dismissible={false} className="max-w-md">
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-2xl">
        {/* Login View */}
        {view === 'login' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700">
                <span className="text-2xl font-bold text-white">F</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('auth.welcome')}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('auth.enterCode')}</p>
            </div>

            <div className="space-y-3">
              <input
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
                  'w-full rounded-xl border bg-gray-50 dark:bg-gray-700 px-4 py-3.5 text-center font-mono text-xl tracking-[0.2em] text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-500 focus:border-brand-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all',
                  error ? 'border-red-300' : 'border-gray-200 dark:border-gray-600'
                )}
              />
              {error && (
                <p className="text-center text-sm text-red-600">{error}</p>
              )}
            </div>

            <button
              onClick={handleLogin}
              disabled={loading || code.length < 9}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('auth.loggingIn')}
                </span>
              ) : (
                t('auth.login')
              )}
            </button>

            <div className="text-center">
              <button
                onClick={() => setView('register')}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                {t('auth.dontHaveCode')} {t('auth.register')}
              </button>
            </div>
          </div>
        )}

        {/* Register View */}
        {view === 'register' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700">
                <span className="text-2xl font-bold text-white">F</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('auth.createAccount')}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('auth.codeHint')}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>{t('auth.important')}:</strong> {t('auth.saveWarning')}
              </p>
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('auth.generating')}
                </span>
              ) : (
                t('auth.generateCode')
              )}
            </button>

            <div className="text-center">
              <button
                onClick={() => { setView('login'); setError('') }}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                {t('auth.alreadyHaveCode')} {t('auth.login')}
              </button>
            </div>
          </div>
        )}

        {/* Code Reveal View */}
        {view === 'code-reveal' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('auth.savedCode')}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('auth.codeRevealSaveWarning')}
              </p>
            </div>

            <div className="relative">
              <div className="rounded-xl border-2 border-dashed border-brand-200 bg-brand-50 dark:bg-brand-900/20 p-6 text-center">
                <p className="font-mono text-3xl font-bold tracking-[0.15em] text-brand-700 dark:text-brand-400">
                  {generatedCode}
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                className="absolute right-2 top-2 rounded-lg p-2 text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-600 transition-colors"
                title={t('auth.copyToClipboard')}
              >
                {copied ? (
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                )}
              </button>
            </div>

            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
              <p className="text-sm text-red-800 dark:text-red-300 text-center">
                <strong>{t('auth.saveWarning')}</strong> {t('auth.codeRevealWarning')}
              </p>
            </div>

            <button
              onClick={() => onLogin(generatedCode)}
              className="btn-primary w-full py-3"
            >
              {t('auth.copiedSaved')}
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
