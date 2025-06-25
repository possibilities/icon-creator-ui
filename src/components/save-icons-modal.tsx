'use client'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface SaveIconsModalProps {
  isOpen: boolean
  onClose: () => void
  shapeName: string
}

export function SaveIconsModal({
  isOpen,
  onClose,
  shapeName,
}: SaveIconsModalProps) {
  const handleSave = () => {
    console.log('Saving icons...')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Save Icons</DialogTitle>
        </DialogHeader>

        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <p className='text-lg text-muted-foreground mb-2'>
              Icon save options for
            </p>
            <p className='text-2xl font-semibold'>{shapeName}</p>
            <p className='text-sm text-muted-foreground mt-4'>
              (Placeholder - Icon export coming soon)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
