'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { GAP } from './viewer-defaults'

interface GapContextType {
  gap: number
  setGap: (gap: number) => void
}

const GapContext = createContext<GapContextType | undefined>(undefined)

export function GapProvider({ children }: { children: ReactNode }) {
  const [gap, setGap] = useState(GAP)

  return (
    <GapContext.Provider value={{ gap, setGap }}>
      {children}
    </GapContext.Provider>
  )
}

export function useGap() {
  const context = useContext(GapContext)
  if (!context) {
    throw new Error('useGap must be used within a GapProvider')
  }
  return context
}
