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
  const [justRegistered, setJustRegistered] = useState(false)

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
    setJustRegistered(true)
    return res.code
  }

  const dismissRegisterModal = () => setJustRegistered(false)

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

  const updateSettings = async (patch: Record<string, any>) => {
    // Optimistic update for instant UI feedback
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
    // Persist to server, then re-sync to guarantee consistency
    await api.settings.update(patch)
    const res = await api.auth.me()
    setState((s) => ({ ...s, settings: res.settings }))
  }

  return {
    ...state,
    justRegistered,
    login,
    register,
    logout,
    checkAuth,
    updateSettings,
    dismissRegisterModal,
  }
}
