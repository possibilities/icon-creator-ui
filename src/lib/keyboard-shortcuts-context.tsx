'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface KeyboardShortcutsContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const KeyboardShortcutsContext = createContext<
  KeyboardShortcutsContextType | undefined
>(undefined)

export function KeyboardShortcutsProvider({
  children,
}: {
  children: ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <KeyboardShortcutsContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </KeyboardShortcutsContext.Provider>
  )
}

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext)
  if (!context) {
    throw new Error(
      'useKeyboardShortcuts must be used within KeyboardShortcutsProvider',
    )
  }
  return context
}
