import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

interface TransactionFilters {
  type?: string
  account_id?: string
  category?: string
  search?: string
  from?: string
  to?: string
  sort?: string
  order?: string
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<TransactionFilters>({})
  const [page, setPage] = useState(1)
  const limit = 50

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const cleanFilters: Record<string, string> = {}
      for (const [k, v] of Object.entries(filters)) {
        if (v) cleanFilters[k] = v
      }
      cleanFilters.page = String(page)
      cleanFilters.limit = String(limit)
      const res = await api.transactions.list(cleanFilters)
      setTransactions(res.transactions)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => { fetch() }, [fetch])

  const createTransaction = async (data: any) => {
    const txn = await api.transactions.create(data)
    setPage(1)
    await fetch()
    return txn
  }

  const updateTransaction = async (id: string, data: any) => {
    const txn = await api.transactions.update(id, data)
    await fetch()
    return txn
  }

  const deleteTransaction = async (id: string) => {
    await api.transactions.delete(id)
    await fetch()
  }

  return {
    transactions,
    total,
    loading,
    page,
    setPage,
    limit,
    filters,
    setFilters: (f: TransactionFilters) => { setFilters(prev => ({ ...prev, ...f })); setPage(1) },
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetch,
  }
}
