import { Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { ThemeProvider } from './lib/theme'
import { AuthModal } from './components/AuthModal'
import { RegisterSuccessModal } from './components/RegisterSuccessModal'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Transactions } from './pages/Transactions'
import { Budgets } from './pages/Budgets'
import { Categories } from './pages/Categories'
import { Settings } from './pages/Settings'

export default function App() {
  const auth = useAuth()

  if (auth.loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!auth.authenticated) {
    return (
      <ThemeProvider initialTheme={auth.settings?.theme || 'system'} locale={auth.settings?.language || 'en'}>
        <AuthModal
          open={true}
          onLogin={auth.login}
          onRegister={auth.register}
        />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider initialTheme={auth.settings?.theme || 'system'} locale={auth.settings?.language || 'en'}>
      <Layout userCode={auth.code} settings={auth.settings} onLogout={auth.logout}>
        <Routes>
          <Route path="/" element={<Dashboard userCode={auth.code} settings={auth.settings} />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>

        <RegisterSuccessModal
          open={auth.justRegistered}
          code={auth.code}
          onClose={auth.dismissRegisterModal}
        />
      </Layout>
    </ThemeProvider>
  )
}
