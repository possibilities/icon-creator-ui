'use client'

import { useRouter, useParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
      <div className='mt-4'>
        <Select value={gap.toString()} onValueChange={value => onGapChange(Number(value))}>
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Gap size'>{gap}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 20 }, (_, i) => i + 1).map(value => (
              <SelectItem key={value} value={value.toString()}>{value}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </aside>
  )
}
