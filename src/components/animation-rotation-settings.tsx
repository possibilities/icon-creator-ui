'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { WideTargetSlider } from '@/components/wide-target-slider'
import { URL_PARAMS } from '@/lib/viewer-params'

export function AnimationRotationSettings() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlSpeed = parseFloat(searchParams.get(URL_PARAMS.SPEED) || '30')
  const urlDirection = searchParams.get(URL_PARAMS.DIRECTION) || 'forward'

  const [localSpeed, setLocalSpeed] = useState(urlSpeed)
  const [localDirection, setLocalDirection] = useState(
    urlDirection === 'reverse',
  )

  useEffect(() => {
    setLocalSpeed(urlSpeed)
    setLocalDirection(urlDirection === 'reverse')
  }, [urlSpeed, urlDirection])

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      params.set(key, value)
    })
    router.push(`?${params.toString()}`)
  }

  const handleDirectionChange = (checked: boolean) => {
    setLocalDirection(checked)
    updateURL({ [URL_PARAMS.DIRECTION]: checked ? 'reverse' : 'forward' })
  }

  return (
    <div className='space-y-4'>
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate'>
            Rotation Speed
          </label>
          <span className='text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0'>
            {localSpeed.toFixed(0)} RPM
          </span>
        </div>
        <div className='relative pt-1'>
          <WideTargetSlider
            value={[localSpeed]}
            onValueChange={([value]) => {
              setLocalSpeed(value)
            }}
            onValueCommit={([value]) => {
              setLocalSpeed(value)
              updateURL({ [URL_PARAMS.SPEED]: value.toString() })
            }}
            min={1}
            max={120}
            step={1}
            className='w-full'
          />
          <div className='flex justify-between mt-4'>
            <span className='text-xs text-muted-foreground'>Slow</span>
            <span className='text-xs text-muted-foreground'>Fast</span>
          </div>
        </div>
      </div>

      <div className='flex items-center justify-between'>
        <Label htmlFor='rotation-direction' className='text-sm'>
          Reverse Direction
        </Label>
        <Switch
          id='rotation-direction'
          checked={localDirection}
          onCheckedChange={handleDirectionChange}
        />
      </div>
    </div>
  )
}
