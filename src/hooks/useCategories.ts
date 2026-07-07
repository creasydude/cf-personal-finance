import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

export function useCategories() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      const res = await api.categories.list()
      setCategories(res.categories)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const createCategory = async (data: any) => {
    const cat = await api.categories.create(data)
    await fetch()
    return cat
  }

  return { categories, loading, createCategory, refetch: fetch }
}
