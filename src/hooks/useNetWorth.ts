import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

export function useNetWorth() {
  const [data, setData] = useState<any>(null)
  const [range, setRange] = useState('1y')
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.netWorth(range)
      setData(res)
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => { fetch() }, [fetch])

  return { data, range, setRange, loading, refetch: fetch }
}
