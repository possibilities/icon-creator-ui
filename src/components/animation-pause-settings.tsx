'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { WideTargetSlider } from '@/components/wide-target-slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { URL_PARAMS } from '@/lib/viewer-params'

type PauseMode = 'none' | 'before' | 'after'

export function AnimationPauseSettings() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlPauseDuration = parseFloat(
    searchParams.get(URL_PARAMS.PAUSE_DURATION) || '0',
  )
  const urlRepeatCount = parseInt(
    searchParams.get(URL_PARAMS.REPEAT_COUNT) || '1',
  )
  const urlPauseMode = (searchParams.get(URL_PARAMS.PAUSE_MODE) ||
    'none') as PauseMode

  const [localPauseDuration, setLocalPauseDuration] = useState(urlPauseDuration)
  const [localRepeatCount, setLocalRepeatCount] = useState(urlRepeatCount)
  const [pauseMode, setPauseMode] = useState<PauseMode>(
    urlPauseDuration > 0
      ? urlPauseMode === 'none'
        ? 'after'
        : urlPauseMode
      : 'none',
  )

  useEffect(() => {
    setLocalPauseDuration(urlPauseDuration)
    if (urlPauseDuration > 0 && urlPauseMode !== 'none') {
      setPauseMode(urlPauseMode)
    } else if (urlPauseDuration === 0) {
      setPauseMode('none')
    }
  }, [urlPauseDuration, urlPauseMode])

  useEffect(() => {
    setLocalRepeatCount(urlRepeatCount)
  }, [urlRepeatCount])

  const updateURL = (updates: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (
        (key === URL_PARAMS.PAUSE_DURATION && value === 0) ||
        (key === URL_PARAMS.PAUSE_MODE && value === 'none')
      ) {
        params.delete(key)
      } else {
        params.set(key, value.toString())
      }
    })
    router.push(`?${params.toString()}`)
  }

  const handlePauseModeChange = (mode: PauseMode) => {
    setPauseMode(mode)

    if (mode === 'none') {
      updateURL({
        [URL_PARAMS.PAUSE_DURATION]: 0,
        [URL_PARAMS.PAUSE_MODE]: 'none',
      })
    } else {
      const newDuration = localPauseDuration > 0 ? localPauseDuration : 2
      setLocalPauseDuration(newDuration)
      updateURL({
        [URL_PARAMS.PAUSE_DURATION]: newDuration,
        [URL_PARAMS.PAUSE_MODE]: mode,
      })
    }
  }

  return (
    <div className='space-y-4'>
      <div>
        <Select
          value={pauseMode}
          onValueChange={value => handlePauseModeChange(value as PauseMode)}
        >
          <SelectTrigger className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='none'>No pause</SelectItem>
            <SelectItem value='before'>Pause before</SelectItem>
            <SelectItem value='after'>Pause after</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {pauseMode !== 'none' && (
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
