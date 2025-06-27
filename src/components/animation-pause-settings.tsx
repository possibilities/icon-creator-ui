'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { WideTargetSlider } from '@/components/wide-target-slider'
import { URL_PARAMS } from '@/lib/viewer-params'

export function AnimationPauseSettings() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlPauseDuration = parseFloat(
    searchParams.get(URL_PARAMS.PAUSE_DURATION) || '0',
  )
  const urlRepeatCount = parseInt(
    searchParams.get(URL_PARAMS.REPEAT_COUNT) || '1',
  )
  const isPauseEnabled = urlPauseDuration > 0

  const [localPauseDuration, setLocalPauseDuration] = useState(urlPauseDuration)
  const [localRepeatCount, setLocalRepeatCount] = useState(urlRepeatCount)
  const [pauseEnabled, setPauseEnabled] = useState(isPauseEnabled)

  useEffect(() => {
    setLocalPauseDuration(urlPauseDuration)
    setPauseEnabled(urlPauseDuration > 0)
  }, [urlPauseDuration])

  useEffect(() => {
    setLocalRepeatCount(urlRepeatCount)
  }, [urlRepeatCount])

  const updateURL = (updates: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === 0 && key === URL_PARAMS.PAUSE_DURATION) {
        params.delete(key)
      } else {
        params.set(key, value.toString())
      }
    })
    router.push(`?${params.toString()}`)
  }

  const handlePauseToggle = (checked: boolean) => {
    setPauseEnabled(checked)
    if (checked) {
      const newDuration = localPauseDuration > 0 ? localPauseDuration : 2
      setLocalPauseDuration(newDuration)
      updateURL({ [URL_PARAMS.PAUSE_DURATION]: newDuration })
    } else {
      updateURL({ [URL_PARAMS.PAUSE_DURATION]: 0 })
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Label htmlFor='pause-toggle' className='text-sm font-medium'>
          Pause Between Cycles
        </Label>
        <Switch
          id='pause-toggle'
          checked={pauseEnabled}
          onCheckedChange={handlePauseToggle}
        />
      </div>

      {pauseEnabled && (
        <>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate'>
                Cycles Before Pause
              </label>
              <span className='text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0'>
                {localRepeatCount}
              </span>
            </div>
            <div className='relative pt-1'>
              <WideTargetSlider
                value={[localRepeatCount]}
                onValueChange={([value]) => {
                  setLocalRepeatCount(value)
                }}
                onValueCommit={([value]) => {
                  setLocalRepeatCount(value)
                  updateURL({ [URL_PARAMS.REPEAT_COUNT]: value })
                }}
                min={1}
                max={10}
                step={1}
                className='w-full'
              />
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate'>
                Pause Duration
              </label>
              <span className='text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0'>
                {localPauseDuration.toFixed(1)}s
              </span>
            </div>
            <div className='relative pt-1'>
              <WideTargetSlider
                value={[localPauseDuration]}
                onValueChange={([value]) => {
                  setLocalPauseDuration(value)
                }}
                onValueCommit={([value]) => {
                  setLocalPauseDuration(value)
                  updateURL({ [URL_PARAMS.PAUSE_DURATION]: value })
                }}
                min={0.1}
                max={10}
                step={0.1}
                className='w-full'
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
