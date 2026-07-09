import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../api/client'
import { Modal } from '../components/ui/Modal'
import { CurrencyPicker } from '../components/ui/CurrencyPicker'
import { useTheme } from '../lib/theme'
import { useTranslation } from '../hooks/useTranslation'
import { cn } from '../lib/utils'

type SettingsTab = 'account' | 'import-export' | 'preferences' | 'security'

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Tehran', 'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Tokyo',
  'Asia/Seoul', 'Asia/Singapore', 'Asia/Shanghai', 'Australia/Sydney', 'Pacific/Auckland',
]

const DATE_FORMATS = [
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
  { label: 'DD MMM YYYY', value: 'DD MMM YYYY' },
  { label: 'MMM DD, YYYY', value: 'MMM DD, YYYY' },
]

// Removed hardcoded CURRENCIES_FOR_DEFAULT — now using CurrencyPicker

export function Settings() {
  const auth = useAuth()
  const { t } = useTranslation(auth.settings)
  const [activeTab, setActiveTab] = useState<SettingsTab>('account')
  const [settings, setSettings] = useState<any>(auth.settings || {})
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [exportHistory, setExportHistory] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setSettings(auth.settings || {})
    // Load export history from settings
    if (auth.settings?.exportHistory) {
      setExportHistory(auth.settings.exportHistory)
    }
  }, [auth.settings])

  const saveSetting = async (key: string, value: any) => {
    setSaving(true)
    try {
      setSettings((s: any) => ({ ...s, [key]: value }))
      await auth.updateSettings({ [key]: value })
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    try {
      const data = await api.exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finance-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      // Log export date
      const newHistory = [{ date: new Date().toISOString() }, ...exportHistory].slice(0, 10)
      setExportHistory(newHistory)
      await api.settings.update({ exportHistory: newHistory })
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await api.importData(data)
      window.location.reload()
    } catch (err) {
      console.error('Import failed:', err)
      alert(t('delete.importFailed'))
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await api.deleteAccount()
      // Force full page reload to clear all state
      window.location.href = '/'
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const handleResetAccount = async () => {
    try {
      await api.resetAccount()
      window.location.reload()
    } catch (err) {
      console.error('Reset failed:', err)
    }
  }

  const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { key: 'account', label: t('settings.account'), icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    )},
    { key: 'import-export', label: t('settings.importExport'), icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    )},
    { key: 'preferences', label: t('settings.preferences'), icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
    { key: 'security', label: t('settings.security'), icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    )},
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>

      <div className="flex gap-6 flex-col md:flex-row">
        {/* Sidebar tabs */}
        <nav className="w-full md:w-56 flex-shrink-0">
          <div className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'account' && (
            <AccountSection
              settings={settings}
              userCode={auth.code}
              onSave={saveSetting}
              onDelete={() => setShowDeleteConfirm(true)}
              onReset={() => setShowResetConfirm(true)}
            />
          )}

          {activeTab === 'import-export' && (
            <ImportExportSection
              onExport={handleExport}
              onImport={handleImport}
              exportHistory={exportHistory}
            />
          )}

          {activeTab === 'preferences' && (
            <PreferencesSection
              settings={settings}
              onSave={saveSetting}
              saving={saving}
              t={t}
            />
          )}

          {activeTab === 'security' && (
            <SecuritySection
              settings={settings}
              onSave={saveSetting}
              saving={saving}
              t={t}
            />
          )}
        </div>
      </div>

      {/* Delete Account Confirm */}
      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} className="max-w-sm">
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('settings.deleteAccount')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {t('delete.permanentlyDelete')}
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1">{t('account.cancel')}</button>
            <button onClick={handleDeleteAccount} className="flex-1 rounded-xl px-4 py-2.5 bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors">
              {t('delete.forever')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset Account Confirm */}
      <Modal open={showResetConfirm} onClose={() => setShowResetConfirm(false)} className="max-w-sm">
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('settings.resetAccount')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {t('settings.resetAccount')} — {t('settings.deleteAccount')}
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowResetConfirm(false)} className="btn-secondary flex-1">{t('account.cancel')}</button>
            <button onClick={handleResetAccount} className="flex-1 rounded-xl px-4 py-2.5 bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 transition-colors">
              {t('delete.resetEverything')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Account Section ─────────────────────────────────────────
function AccountSection({
  settings,
  userCode,
  onSave,
  onDelete,
  onReset,
}: {
  settings: any
  userCode: string | null
  onSave: (key: string, value: any) => Promise<void>
  onDelete: () => void
  onReset: () => void
}) {
  const { t } = useTranslation(settings)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [nickname, setNickname] = useState(settings.nickname || '')
  const [photoPreview, setPhotoPreview] = useState<string | null>(settings.photo || null)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setNickname(settings.nickname || '')
    setPhotoPreview(settings.photo || null)
  }, [settings.nickname, settings.photo])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave('nickname', nickname)
      if (photoPreview !== settings.photo) {
        await onSave('photo', photoPreview)
      }
      window.location.reload()
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyCode = async () => {
    if (!userCode) return
    await navigator.clipboard.writeText(userCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Access Code */}
      <div className="card p-6 dark:bg-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('settings.accessCode')}</h3>
        <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-2xl font-bold tracking-[0.15em] text-amber-800">
              {userCode || '—'}
            </p>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 rounded-lg bg-white border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              {copied ? (
                <>
                  <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {t('settings.copied')}
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  {t('settings.copy')}
                </>
              )}
            </button>
          </div>
          <div className="flex items-start gap-2 mt-3">
            <svg className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-amber-800">
              {t('settings.accessCodeWarning')}
            </p>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className="card p-6 dark:bg-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('settings.profile')}</h3>

        {/* Photo */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
                {nickname ? nickname.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-700 shadow-sm transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.uploadPhoto')}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{t('settings.photoHint')}</p>
          </div>
        </div>

        {/* Nickname */}
        <div className="mb-4">
          <label className="label mb-1.5 block dark:text-gray-400">{t('settings.nickname')}</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t('settings.nicknamePlaceholder')}
            className="input max-w-sm"
          />
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={isSaving} className="btn-primary">
            {isSaving ? t('settings.saving') : saved ? t('settings.saved') : t('settings.saveChanges')}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card border-red-200 dark:border-red-800 p-6 dark:bg-gray-800">
        <h3 className="text-sm font-semibold text-red-900 dark:text-red-400 mb-4">{t('settings.dangerZone')}</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={onReset} className="btn-secondary border-amber-300 text-amber-700 hover:bg-amber-50">
            {t('settings.resetAccount')}
          </button>
          <button onClick={onDelete} className="rounded-xl px-4 py-2.5 border border-red-300 text-red-700 font-medium text-sm hover:bg-red-50 transition-colors">
            {t('settings.deleteAccount')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Import / Export Section ─────────────────────────────────
function ImportExportSection({
  onExport,
  onImport,
  exportHistory,
}: {
  onExport: () => void
  onImport: (file: File) => void
  exportHistory: any[]
}) {
  const { t, locale } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-6">
      {/* Export */}
      <div className="card p-6 dark:bg-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{t('settings.exportData')}</h3>
        <p className="text-sm text-gray-500 mb-4">
          {t('settings.exportHint')}
        </p>
        <button onClick={onExport} className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {t('settings.exportAll')}
        </button>
      </div>

      {/* Export History */}
      {exportHistory.length > 0 && (
        <div className="card p-6 dark:bg-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t('settings.recentExports')}</h3>
          <div className="space-y-2">
            {exportHistory.map((exp, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {new Date(exp.date).toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import */}
      <div className="card p-6 dark:bg-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{t('settings.importData')}</h3>
        <p className="text-sm text-gray-500 mb-4">
          {t('settings.importHint')}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
        />
        <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          {t('settings.importFile')}
        </button>
      </div>
    </div>
  )
}

// ─── Preferences Section ─────────────────────────────────────
function PreferencesSection({
  settings,
  onSave,
  saving,
  t,
}: {
  settings: any
  onSave: (key: string, value: any) => Promise<void>
  saving: boolean
  t: (key: string) => string
}) {
  const { setTheme: applyTheme } = useTheme()
  const [language, setLanguage] = useState(settings.language || 'en')
  const [timezone, setTimezone] = useState(settings.timezone || 'UTC')
  const [dateFormat, setDateFormat] = useState(settings.dateFormat || 'YYYY-MM-DD')
  const [defaultCurrency, setDefaultCurrency] = useState(settings.baseCurrency || 'IRR')
  const [theme, setTheme] = useState(settings.theme || 'system')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLanguage(settings.language || 'en')
    setTimezone(settings.timezone || 'UTC')
    setDateFormat(settings.dateFormat || 'YYYY-MM-DD')
    setDefaultCurrency(settings.baseCurrency || 'IRR')
    setTheme(settings.theme || 'system')
  }, [settings.language, settings.timezone, settings.dateFormat, settings.baseCurrency, settings.theme])

  const handleSave = async () => {
    await onSave('language', language)
    await onSave('timezone', timezone)
    await onSave('dateFormat', dateFormat)
    await onSave('baseCurrency', defaultCurrency)
    await onSave('theme', theme)
    applyTheme(theme)
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div className="card p-6 dark:bg-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('settings.general')}</h3>
        <div className="space-y-4 max-w-lg">
          {/* Language */}
          <div>
            <label className="label mb-1.5 block dark:text-gray-400">{t('settings.language')}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input"
            >
              <option value="en">English</option>
              <option value="fa">Persian (فارسی)</option>
            </select>
          </div>

          {/* Timezone */}
          <div>
            <label className="label mb-1.5 block dark:text-gray-400">{t('settings.timezone')}</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="input"
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          {/* Date Format */}
          <div>
            <label className="label mb-1.5 block dark:text-gray-400">{t('settings.dateFormat')}</label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="input"
            >
              {DATE_FORMATS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Default Currency */}
          <div>
            <label className="label mb-1.5 block dark:text-gray-400">{t('settings.defaultCurrency')}</label>
            <CurrencyPicker value={defaultCurrency} onChange={setDefaultCurrency} showType />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('settings.defaultCurrencyHint')}</p>
          </div>
        </div>
      </div>

      {/* Theme */}
      <div className="card p-6 dark:bg-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('settings.appearance')}</h3>
        <div className="flex gap-3">
          {([
            { key: 'light', label: t('settings.light'), icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            )},
            { key: 'dark', label: t('settings.dark'), icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )},
            { key: 'system', label: t('settings.system'), icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 7.41A2.25 2.25 0 012.25 5.496V5.25" />
              </svg>
            )},
          ]).map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTheme(t.key)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border-2 px-6 py-4 transition-all',
                theme === t.key
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              )}
            >
              {t.icon}
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? t('settings.saving') : saved ? t('settings.saved') : t('settings.saveChanges')}
        </button>
      </div>
    </div>
  )
}

// ─── Security Section ────────────────────────────────────────
function SecuritySection({
  settings,
  onSave,
  saving,
  t,
}: {
  settings: any
  onSave: (key: string, value: any) => Promise<void>
  saving: boolean
  t: (key: string) => string
}) {
  const [twoFactor, setTwoFactor] = useState(settings.twoFactorEnabled || false)

  return (
    <div className="space-y-6">
      <div className="card p-6 dark:bg-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('settings.twoFactor')}</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              {twoFactor ? t('settings.twoFactorEnabled') : t('settings.twoFactorDisabled')}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('settings.twoFactorHint')}
            </p>
          </div>
          <button
            onClick={() => {
              const newVal = !twoFactor
              setTwoFactor(newVal)
              onSave('twoFactorEnabled', newVal)
            }}
            className={cn(
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
              twoFactor ? 'bg-brand-600' : 'bg-gray-200'
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                twoFactor ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
        </div>
        {twoFactor && (
          <div className="mt-4 rounded-xl bg-brand-50 border border-brand-200 p-4">
            <p className="text-sm text-brand-800">
              {t('settings.twoFactorActive')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
