'use client'

import { MoreVertical, Moon, Sun, Keyboard } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useKeyboardShortcuts } from '@/lib/keyboard-shortcuts-context'

export function MoreMenu() {
  const { theme, setTheme } = useTheme()
  const { setIsOpen: setKeyboardShortcutsOpen } = useKeyboardShortcuts()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon'>
          <MoreVertical className='h-[1.2rem] w-[1.2rem]' />
          <span className='sr-only'>More options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={toggleTheme}>
          <Sun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
          <Moon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
          <span className='ml-6'>Theme</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setKeyboardShortcutsOpen(true)}>
          <Keyboard className='h-[1.2rem] w-[1.2rem]' />
          <span className='ml-2'>Keyboard</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
