'use client'

import { useRouter, useParams, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WideTargetSlider } from '@/components/wide-target-slider'
import { GAP } from '@/lib/viewer-defaults'

interface ShapeSidebarProps {
  shapes: string[]
  mode: string
  gap: number
  onGapChange: (gap: number) => void
  pitch: number
  onPitchChange: (pitch: number) => void
  yaw: number
  onYawChange: (yaw: number) => void
  roll: number
  onRollChange: (roll: number) => void
  fov: number
  onFovChange: (fov: number) => void
  speed: number
  onSpeedChange: (speed: number) => void
}

export default function ShapeSidebar({
  shapes,
  mode,
  gap,
  onGapChange,
  pitch,
  onPitchChange,
  yaw,
  onYawChange,
  roll,
  onRollChange,
  fov,
  onFovChange,
  speed,
  onSpeedChange,
}: ShapeSidebarProps) {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const currentShape = params.shape as string

  const handleShapeChange = (value: string) => {
    const queryString = searchParams.toString()
    router.push(`/${value}/${mode}${queryString ? `?${queryString}` : ''}`)
  }

  const handleModeChange = (value: string) => {
    const queryString = searchParams.toString()
    router.push(
      `/${currentShape}/${value}${queryString ? `?${queryString}` : ''}`,
    )
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
      <Tabs
        value={mode}
        onValueChange={handleModeChange}
        className='w-full mt-4'
      >
        <TabsList className='w-full'>
          <TabsTrigger value='scene' className='flex-1'>
            Scene
          </TabsTrigger>
          <TabsTrigger value='motion' className='flex-1'>
            Motion
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {mode === 'scene' ? (
        <div className='mt-6 space-y-6'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate'>
                Look Up/Down
              </label>
              <span className='text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0'>
                {pitch}°
              </span>
            </div>
            <WideTargetSlider
              value={[pitch]}
              onValueChange={value => onPitchChange(value[0])}
              defaultValue={[0]}
              min={-180}
              max={180}
              step={1}
              className='w-full'
            />
          </div>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate'>
                Turn Left/Right
              </label>
              <span className='text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0'>
                {yaw}°
              </span>
            </div>
            <WideTargetSlider
              value={[yaw]}
              onValueChange={value => onYawChange(value[0])}
              defaultValue={[0]}
              min={-180}
              max={180}
              step={1}
              className='w-full'
            />
          </div>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate'>
                Tilt Sideways
              </label>
              <span className='text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0'>
                {roll}°
              </span>
            </div>
            <WideTargetSlider
              value={[roll]}
              onValueChange={value => onRollChange(value[0])}
              defaultValue={[0]}
              min={-180}
              max={180}
              step={1}
              className='w-full'
            />
          </div>
          <hr className='my-6 border-border' />
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate'>
                Field of View
              </label>
              <span className='text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0'>
                {fov}°
              </span>
            </div>
            <div className='relative pt-1'>
              <WideTargetSlider
                value={[fov]}
                onValueChange={value => onFovChange(value[0])}
                defaultValue={[23]}
                min={1}
                max={40}
                step={1}
                className='w-full'
              />
              <div className='flex justify-between mt-4'>
                <span className='text-xs text-muted-foreground'>Narrow</span>
                <span className='text-xs text-muted-foreground'>Wide</span>
              </div>
            </div>
          </div>
          <hr className='my-6 border-border' />
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate'>
                Face Separation
              </label>
              <span className='text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0'>
                {gap}
              </span>
            </div>
            <div className='relative pt-1'>
              <WideTargetSlider
                value={[gap]}
                onValueChange={handleGapChange}
                defaultValue={[GAP]}
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
        </div>
      ) : (
        <div className='mt-6 space-y-6'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate'>
                Rotation Speed
              </label>
              <span className='text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0'>
                {speed}°/s
              </span>
            </div>
            <div className='relative pt-1'>
              <WideTargetSlider
                value={[speed]}
                onValueChange={value => onSpeedChange(value[0])}
                defaultValue={[30]}
                min={0}
                max={120}
                step={1}
                className='w-full'
              />
              <div className='flex justify-between mt-4'>
                <span className='text-xs text-muted-foreground'>Stop</span>
                <span className='text-xs text-muted-foreground'>Fast</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
