'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { MoonIcon, SunIcon } from 'lucide-react'

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <button
      aria-label='Toggle theme'
      onClick={toggleTheme}
      className='fixed top-4 right-4 z-50 rounded-md border bg-background p-2 text-foreground shadow'
    >
      {theme === 'dark' ? (
        <SunIcon className='size-4' />
      ) : (
        <MoonIcon className='size-4' />
      )}
    </button>
  )
}
