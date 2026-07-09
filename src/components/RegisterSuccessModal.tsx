import { useState } from 'react'
import { Modal } from './ui/Modal'
import { useTranslation } from '../hooks/useTranslation'

interface RegisterSuccessModalProps {
  open: boolean
  code: string | null
  onClose: () => void
}

export function RegisterSuccessModal({ open, code, onClose }: RegisterSuccessModalProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCopied(true)
  }

  return (
    <Modal open={open} dismissible={copied} onClose={copied ? onClose : undefined} className="max-w-md">
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-2xl text-center">
        <div className="mb-5 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('auth.savedCode')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {t('auth.codeRevealDesc')}
        </p>

        <div className="rounded-xl border-2 border-dashed border-brand-200 bg-brand-50 dark:bg-brand-900/20 p-5 mb-4">
          <p className="font-mono text-3xl font-bold tracking-[0.15em] text-brand-700 dark:text-brand-400">
            {code}
          </p>
        </div>

        <div className="flex items-start gap-2 justify-center mb-6">
          <svg className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-amber-800 dark:text-amber-300 text-left">
            <strong>{t('auth.codeRevealCannotRecover')}</strong>
          </p>
        </div>

        {!copied ? (
          <button onClick={handleCopy} className="btn-primary w-full py-3 text-base">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            {t('auth.copyCode')}
          </button>
        ) : (
          <button onClick={onClose} className="btn-primary w-full py-3 text-base">
            {t('auth.continueToDashboard')}
          </button>
        )}
      </div>
    </Modal>
  )
}
