import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { AuthModal } from './components/AuthModal'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Transactions } from './pages/Transactions'
import { Budgets } from './pages/Budgets'

export default function App() {
  const auth = useAuth()

  if (auth.loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!auth.authenticated) {
    return (
      <AuthModal
        open={true}
        onLogin={auth.login}
        onRegister={auth.register}
      />
    )
  }

  return (
    <Layout userCode={auth.code} onLogout={auth.logout}>
      <Routes>
        <Route path="/" element={<Dashboard userCode={auth.code} />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/budgets" element={<Budgets />} />
      </Routes>
    </Layout>
  )
}
