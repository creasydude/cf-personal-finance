import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

export function useBudgets(month?: number, year?: number) {
  const [budgets, setBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (month) params.month = String(month)
      if (year) params.year = String(year)
      const res = await api.budgets.list(params)
      setBudgets(res.budgets)
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { fetch() }, [fetch])

  const createBudget = async (data: any) => {
    const budget = await api.budgets.create(data)
    await fetch()
    return budget
  }

  const updateBudget = async (id: string, data: any) => {
    const budget = await api.budgets.update(id, data)
    await fetch()
    return budget
  }

  const deleteBudget = async (id: string) => {
    await api.budgets.delete(id)
    await fetch()
  }

  return { budgets, loading, createBudget, updateBudget, deleteBudget, refetch: fetch }
}
