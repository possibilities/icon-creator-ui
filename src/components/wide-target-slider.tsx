'use client'

import * as React from 'react'
import { Slider } from '@/components/ui/slider'

interface WideTargetSliderProps extends React.ComponentProps<typeof Slider> {
  value?: number[]
  onValueChange?: (value: number[]) => void
  onValueCommit?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
}

export function WideTargetSlider({
  value = [0],
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  ...props
}: WideTargetSliderProps) {
  const sliderRef = React.useRef<HTMLDivElement>(null)

  const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return

    const target = e.target as HTMLElement
    if (target.closest('[data-slot="slider"]')) {
      return
    }

    const rect = sliderRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))

    const range = max - min
    const rawValue = min + percentage * range
    const steppedValue = Math.round(rawValue / step) * step
    const clampedValue = Math.max(min, Math.min(max, steppedValue))

    if (onValueChange) {
      onValueChange([clampedValue])
    }
    if (onValueCommit) {
      onValueCommit([clampedValue])
    }
  }

  return (
    <div ref={sliderRef} className='py-4 -my-4' onClick={handleWrapperClick}>
      <Slider
        value={value}
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
        min={min}
        max={max}
        step={step}
        {...props}
      />
    </div>
  )
}
