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

  const updateCategory = async (id: string, data: any) => {
    const cat = await api.categories.update(id, data)
    await fetch()
    return cat
  }

  const deleteCategory = async (id: string) => {
    await api.categories.delete(id)
    await fetch()
  }

  return { categories, loading, createCategory, updateCategory, deleteCategory, refetch: fetch }
}
