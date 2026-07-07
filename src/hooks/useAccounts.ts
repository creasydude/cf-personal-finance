import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

export function useAccounts() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [assetsTotal, setAssetsTotal] = useState(0)
  const [liabilitiesTotal, setLiabilitiesTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      const res = await api.accounts.list()
      setAccounts(res.accounts)
      setAssetsTotal(res.assets_total)
      setLiabilitiesTotal(res.liabilities_total)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const createAccount = async (data: any) => {
    const account = await api.accounts.create(data)
    await fetch()
    await new Promise(r => setTimeout(r, 50))
    return account
  }

  const updateAccount = async (id: string, data: any) => {
    const account = await api.accounts.update(id, data)
    await fetch()
    // Wait a tick for React state to propagate
    await new Promise(r => setTimeout(r, 50))
    return account
  }

  const deleteAccount = async (id: string) => {
    await api.accounts.delete(id)
    await fetch()
  }

  return { accounts, assetsTotal, liabilitiesTotal, loading, createAccount, updateAccount, deleteAccount, refetch: fetch }
}
