import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

interface AuthState {
  loading: boolean
  authenticated: boolean
  userId: string | null
  code: string | null
  settings: Record<string, any>
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    loading: true,
    authenticated: false,
    userId: null,
    code: null,
    settings: {},
  })

  const checkAuth = useCallback(async () => {
    try {
      const res = await api.auth.me()
      setState({
        loading: false,
        authenticated: true,
        userId: res.userId,
        code: res.code,
        settings: res.settings,
      })
    } catch {
      setState({
        loading: false,
        authenticated: false,
        userId: null,
        code: null,
        settings: {},
      })
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (code: string) => {
    await api.auth.login(code)
    await checkAuth()
  }

  const register = async () => {
    const res = await api.auth.register()
    await checkAuth()
    return res.code
  }

  const logout = async () => {
    await api.auth.logout()
    setState({
      loading: false,
      authenticated: false,
      userId: null,
      code: null,
      settings: {},
    })
  }

  const updateSettings = async (newSettings: Record<string, any>) => {
    await api.settings.update(newSettings)
    setState((s) => ({ ...s, settings: { ...s.settings, ...newSettings } }))
  }

  return {
    ...state,
    login,
    register,
    logout,
    checkAuth,
    updateSettings,
  }
}
