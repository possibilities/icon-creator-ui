'use client'

import { useRouter, useParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { GAP_SIZE } from '@/lib/defaults'

interface ShapeSidebarProps {
  shapes: string[]
  gap: number
  onGapChange: (gap: number) => void
}

export default function ShapeSidebar({
  shapes,
  gap,
  onGapChange,
}: ShapeSidebarProps) {
  const router = useRouter()
  const params = useParams()
  const currentShape = params.shape as string

  const handleShapeChange = (value: string) => {
    router.push(`/${value}`)
  }

  const handleGapChange = (value: number[]) => {
    onGapChange(value[0])
  }

  const formatShapeName = (name: string) => {
    return name.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
  }

  return (
    <aside className='fixed left-0 top-0 h-full w-1/4 border-r border-border bg-background p-4'>
      <Select value={currentShape} onValueChange={handleShapeChange}>
        <SelectTrigger className='w-full'>
          <SelectValue placeholder='Select a shape'>
            {currentShape && formatShapeName(currentShape)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {shapes.map(shape => (
            <SelectItem key={shape} value={shape}>
              {formatShapeName(shape)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className='mt-6 space-y-3'>
        <div className='flex items-center justify-between'>
          <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
            Face Separation
          </label>
          <span className='text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded'>
            {gap}
          </span>
        </div>
        <div className='relative pt-1'>
          <Slider
            value={[gap]}
            onValueChange={handleGapChange}
            defaultValue={[GAP_SIZE]}
            min={1}
            max={20}
            step={1}
            className='w-full'
          />
          <div className='flex justify-between mt-4'>
            <span className='text-xs text-muted-foreground'>Compact</span>
            <span className='text-xs text-muted-foreground'>Exploded</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
