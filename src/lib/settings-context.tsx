import { createContext, useContext, type ReactNode } from 'react'

const SettingsContext = createContext<Record<string, any>>({})

export function SettingsProvider({ settings, children }: { settings: Record<string, any>; children: ReactNode }) {
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
