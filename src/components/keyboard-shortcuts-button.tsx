'use client'

import { useEffect } from 'react'
import { Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useKeyboardShortcuts } from '@/lib/keyboard-shortcuts-context'

export function KeyboardShortcutsButton() {
  const { isOpen: open, setIsOpen: setOpen } = useKeyboardShortcuts()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === '?') {
        e.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setOpen])

  return (
    <>
      <Button
        variant='outline'
        size='icon'
        onClick={() => setOpen(true)}
        aria-label='Show keyboard shortcuts'
      >
        <Keyboard className='h-[1.2rem] w-[1.2rem]' />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Available keyboard shortcuts for controlling the shape viewer
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-4'>
              <div>
                <h3 className='font-semibold mb-2'>General</h3>
                <div className='space-y-1 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      Show keyboard shortcuts
                    </span>
                    <kbd className='px-2 py-1 text-xs border rounded bg-muted'>
                      Shift + ?
                    </kbd>
                  </div>
                </div>
              </div>
              <div>
                <h3 className='font-semibold mb-2'>Shape Controls</h3>
                <div className='space-y-1 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      Decrease face separation
                    </span>
                    <kbd className='px-2 py-1 text-xs border rounded bg-muted'>
                      Shift + A
                    </kbd>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      Increase face separation
                    </span>
                    <kbd className='px-2 py-1 text-xs border rounded bg-muted'>
                      Shift + S
                    </kbd>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      Narrow field of view
                    </span>
                    <kbd className='px-2 py-1 text-xs border rounded bg-muted'>
                      Shift + Q
                    </kbd>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      Widen field of view
                    </span>
                    <kbd className='px-2 py-1 text-xs border rounded bg-muted'>
                      Shift + W
                    </kbd>
                  </div>
                </div>
              </div>
              <div>
                <h3 className='font-semibold mb-2'>Rotation Controls</h3>
                <div className='space-y-1 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Turn left</span>
                    <kbd className='px-2 py-1 text-xs border rounded bg-muted'>
                      Shift + H
                    </kbd>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Turn right</span>
                    <kbd className='px-2 py-1 text-xs border rounded bg-muted'>
                      Shift + L
                    </kbd>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Look down</span>
                    <kbd className='px-2 py-1 text-xs border rounded bg-muted'>
                      Shift + J
                    </kbd>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Look up</span>
                    <kbd className='px-2 py-1 text-xs border rounded bg-muted'>
                      Shift + K
                    </kbd>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Tilt left</span>
                    <kbd className='px-2 py-1 text-xs border rounded bg-muted'>
                      Shift + N
                    </kbd>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Tilt right</span>
                    <kbd className='px-2 py-1 text-xs border rounded bg-muted'>
                      Shift + P
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
