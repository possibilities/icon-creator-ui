'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { WideTargetSlider } from '@/components/wide-target-slider'
import { URL_PARAMS } from '@/lib/viewer-params'

export function AnimationRotationSettings() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlSpeed = parseFloat(searchParams.get(URL_PARAMS.SPEED) || '30')
  const urlAxisType = searchParams.get(URL_PARAMS.AXIS_TYPE) || 'y'
  const urlAxisX = parseFloat(searchParams.get(URL_PARAMS.AXIS_X) || '0')
  const urlAxisY = parseFloat(searchParams.get(URL_PARAMS.AXIS_Y) || '1')
  const urlAxisZ = parseFloat(searchParams.get(URL_PARAMS.AXIS_Z) || '0')
  const urlDirection = searchParams.get(URL_PARAMS.DIRECTION) || 'forward'

  const [localSpeed, setLocalSpeed] = useState(urlSpeed)
  const [localAxisType, setLocalAxisType] = useState(urlAxisType)
  const [localAxisX, setLocalAxisX] = useState(urlAxisX)
  const [localAxisY, setLocalAxisY] = useState(urlAxisY)
  const [localAxisZ, setLocalAxisZ] = useState(urlAxisZ)
  const [localDirection, setLocalDirection] = useState(
    urlDirection === 'reverse',
  )

  useEffect(() => {
    setLocalSpeed(urlSpeed)
    setLocalAxisType(urlAxisType)
    setLocalAxisX(urlAxisX)
    setLocalAxisY(urlAxisY)
    setLocalAxisZ(urlAxisZ)
    setLocalDirection(urlDirection === 'reverse')
  }, [urlSpeed, urlAxisType, urlAxisX, urlAxisY, urlAxisZ, urlDirection])

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      params.set(key, value)
    })
    router.push(`?${params.toString()}`)
  }

  const handleAxisTypeChange = (newType: string) => {
    setLocalAxisType(newType)
    const updates: Record<string, string> = { [URL_PARAMS.AXIS_TYPE]: newType }

    if (newType === 'x') {
      updates[URL_PARAMS.AXIS_X] = '1'
      updates[URL_PARAMS.AXIS_Y] = '0'
      updates[URL_PARAMS.AXIS_Z] = '0'
    } else if (newType === 'y') {
      updates[URL_PARAMS.AXIS_X] = '0'
      updates[URL_PARAMS.AXIS_Y] = '1'
      updates[URL_PARAMS.AXIS_Z] = '0'
    } else if (newType === 'z') {
      updates[URL_PARAMS.AXIS_X] = '0'
      updates[URL_PARAMS.AXIS_Y] = '0'
      updates[URL_PARAMS.AXIS_Z] = '1'
    }

    updateURL(updates)
  }

  const handleCustomAxisChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const updates: Record<string, string> = {
      [URL_PARAMS.AXIS_TYPE]: 'custom',
    }

    if (axis === 'x') {
      setLocalAxisX(value)
      updates[URL_PARAMS.AXIS_X] = value.toString()
    } else if (axis === 'y') {
      setLocalAxisY(value)
      updates[URL_PARAMS.AXIS_Y] = value.toString()
    } else if (axis === 'z') {
      setLocalAxisZ(value)
      updates[URL_PARAMS.AXIS_Z] = value.toString()
    }

    updateURL(updates)
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

      <div className='space-y-3'>
        <h3 className='text-sm font-medium'>Rotation Axis</h3>

        <RadioGroup
          value={localAxisType}
          onValueChange={handleAxisTypeChange}
          className='space-y-2'
        >
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='y' id='axis-y' />
            <Label htmlFor='axis-y' className='cursor-pointer font-normal'>
              Horizontal (Y-axis)
            </Label>
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='x' id='axis-x' />
            <Label htmlFor='axis-x' className='cursor-pointer font-normal'>
              Vertical Tumble (X-axis)
            </Label>
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='z' id='axis-z' />
            <Label htmlFor='axis-z' className='cursor-pointer font-normal'>
              Wheel Spin (Z-axis)
            </Label>
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='custom' id='axis-custom' />
            <Label htmlFor='axis-custom' className='cursor-pointer font-normal'>
              Custom Axis
            </Label>
          </div>
        </RadioGroup>
      </div>

      {localAxisType === 'custom' && (
        <div className='space-y-3 pl-6 border-l-2 border-muted'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate'>
                X Component
              </label>
              <span className='text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0'>
                {localAxisX.toFixed(2)}
              </span>
            </div>
            <div className='relative pt-1'>
              <WideTargetSlider
                value={[localAxisX]}
                onValueChange={([value]) => {
                  setLocalAxisX(value)
                }}
                onValueCommit={([value]) => {
                  setLocalAxisX(value)
                  handleCustomAxisChange('x', value)
                }}
                min={0}
                max={1}
                step={0.01}
                className='w-full'
              />
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate'>
                Y Component
              </label>
              <span className='text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0'>
                {localAxisY.toFixed(2)}
              </span>
            </div>
            <div className='relative pt-1'>
              <WideTargetSlider
                value={[localAxisY]}
                onValueChange={([value]) => {
                  setLocalAxisY(value)
                }}
                onValueCommit={([value]) => {
                  setLocalAxisY(value)
                  handleCustomAxisChange('y', value)
                }}
                min={0}
                max={1}
                step={0.01}
                className='w-full'
              />
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate'>
                Z Component
              </label>
              <span className='text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0'>
                {localAxisZ.toFixed(2)}
              </span>
            </div>
            <div className='relative pt-1'>
              <WideTargetSlider
                value={[localAxisZ]}
                onValueChange={([value]) => {
                  setLocalAxisZ(value)
                }}
                onValueCommit={([value]) => {
                  setLocalAxisZ(value)
                  handleCustomAxisChange('z', value)
                }}
                min={0}
                max={1}
                step={0.01}
                className='w-full'
              />
            </div>
          </div>
        </div>
      )}

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
