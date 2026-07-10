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
  const [pending2FA, setPending2FA] = useState<{ code: string } | null>(null)

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
    const res = await api.auth.login(code)
    if (res.requires2FA) {
      setPending2FA({ code })
      return { requires2FA: true }
    }
    await checkAuth()
    return {}
  }

  const loginWith2FA = async (totp: string) => {
    if (!pending2FA) return
    await api.auth.login(pending2FA.code, totp)
    setPending2FA(null)
    await checkAuth()
  }

  const cancel2FA = () => setPending2FA(null)

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
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
    await api.settings.update(patch)
    const res = await api.auth.me()
    setState((s) => ({ ...s, settings: res.settings }))
  }

  return {
    ...state,
    justRegistered,
    pending2FA,
    login,
    loginWith2FA,
    cancel2FA,
    register,
    logout,
    checkAuth,
    updateSettings,
    dismissRegisterModal,
  }
}
