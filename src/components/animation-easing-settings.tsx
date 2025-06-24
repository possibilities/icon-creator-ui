'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WideTargetSlider } from '@/components/wide-target-slider'
import { URL_PARAMS } from '@/lib/viewer-params'

export function AnimationEasingSettings() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlEasing = searchParams.get(URL_PARAMS.EASING_TYPE) || 'linear'
  const urlEasingStrength = parseFloat(
    searchParams.get(URL_PARAMS.EASING_STRENGTH) || '1',
  )
  const urlOvershoot = parseFloat(
    searchParams.get(URL_PARAMS.OVERSHOOT) || '20',
  )
  const urlBounces = parseInt(searchParams.get(URL_PARAMS.BOUNCES) || '1')
  const urlSteps = parseInt(searchParams.get(URL_PARAMS.STEPS) || '8')
  const urlStepDuration = parseFloat(
    searchParams.get(URL_PARAMS.STEP_DURATION) || '0.2',
  )

  const [localEasingStrength, setLocalEasingStrength] =
    useState(urlEasingStrength)
  const [localOvershoot, setLocalOvershoot] = useState(urlOvershoot)
  const [localBounces, setLocalBounces] = useState(urlBounces)
  const [localSteps, setLocalSteps] = useState(urlSteps)
  const [localStepDuration, setLocalStepDuration] = useState(urlStepDuration)

  useEffect(() => {
    setLocalEasingStrength(urlEasingStrength)
    setLocalOvershoot(urlOvershoot)
    setLocalBounces(urlBounces)
    setLocalSteps(urlSteps)
    setLocalStepDuration(urlStepDuration)
  }, [urlEasingStrength, urlOvershoot, urlBounces, urlSteps, urlStepDuration])

  const updateURL = (param: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(param, value.toString())
    router.push(`?${params.toString()}`)
  }

  const easingTypes = [
    { value: 'linear', label: 'Linear', description: 'Constant speed' },
    {
      value: 'ease-in-out',
      label: 'Ease In/Out',
      description: 'Smooth acceleration and deceleration',
    },
    { value: 'ease-in', label: 'Ease In', description: 'Start slow, end fast' },
    {
      value: 'ease-out',
      label: 'Ease Out',
      description: 'Start fast, end slow',
    },
    { value: 'elastic', label: 'Elastic', description: 'Bouncy spring effect' },
    { value: 'bounce', label: 'Bounce', description: 'Bounce at the end' },
    { value: 'back', label: 'Back', description: 'Overshoot and return' },
    { value: 'stepped', label: 'Stepped', description: 'Discrete steps' },
    {
      value: 'spring',
      label: 'Spring',
      description: 'Natural spring physics',
    },
  ]

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-2'>
        <label className='text-sm text-muted-foreground'>Easing Type</label>
        <Select
          value={urlEasing}
          onValueChange={value => updateURL(URL_PARAMS.EASING_TYPE, value)}
        >
          <SelectTrigger className='w-full h-auto min-h-[3.5rem] py-3 whitespace-normal [&>span]:line-clamp-none'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {easingTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                <div className='flex flex-col gap-1 text-start'>
                  <span>{type.label}</span>
                  <span className='text-xs text-muted-foreground'>
                    {type.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Easing Strength - for ease-in-out, ease-in, ease-out */}
      {['ease-in-out', 'ease-in', 'ease-out'].includes(urlEasing) && (
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate'>
              Easing Strength
            </label>
            <span className='text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0'>
              {localEasingStrength.toFixed(1)}
            </span>
          </div>
          <div className='relative pt-1'>
            <WideTargetSlider
              value={[localEasingStrength]}
              onValueChange={([value]) => {
                setLocalEasingStrength(value)
                updateURL(URL_PARAMS.EASING_STRENGTH, value)
              }}
              min={0.5}
              max={3}
              step={0.1}
              className='w-full'
            />
            <div className='flex justify-between mt-4'>
              <span className='text-xs text-muted-foreground'>Subtle</span>
              <span className='text-xs text-muted-foreground'>Dramatic</span>
            </div>
          </div>
        </div>
      )}

      {/* Overshoot - for back, elastic, and spring */}
      {['back', 'elastic', 'spring'].includes(urlEasing) && (
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate'>
              Overshoot
            </label>
            <span className='text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0'>
              {localOvershoot.toFixed(0)}°
            </span>
          </div>
          <div className='relative pt-1'>
            <WideTargetSlider
              value={[localOvershoot]}
              onValueChange={([value]) => {
                setLocalOvershoot(value)
                updateURL(URL_PARAMS.OVERSHOOT, value)
              }}
              min={0}
              max={90}
              step={5}
              className='w-full'
            />
            <div className='flex justify-between mt-4'>
              <span className='text-xs text-muted-foreground'>None</span>
              <span className='text-xs text-muted-foreground'>Maximum</span>
            </div>
          </div>
        </div>
      )}

      {/* Bounces - for bounce and elastic */}
      {['bounce', 'elastic'].includes(urlEasing) && (
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate'>
              Bounces
            </label>
            <span className='text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0'>
              {localBounces}
            </span>
          </div>
          <div className='relative pt-1'>
            <WideTargetSlider
              value={[localBounces]}
              onValueChange={([value]) => {
                setLocalBounces(value)
                updateURL(URL_PARAMS.BOUNCES, value)
              }}
              min={1}
              max={5}
              step={1}
              className='w-full'
            />
            <div className='flex justify-between mt-4'>
              <span className='text-xs text-muted-foreground'>Single</span>
              <span className='text-xs text-muted-foreground'>Many</span>
            </div>
          </div>
        </div>
      )}

      {/* Steps - for stepped */}
      {urlEasing === 'stepped' && (
        <>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate'>
                Steps
              </label>
              <span className='text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0'>
                {localSteps}
              </span>
            </div>
            <div className='relative pt-1'>
              <WideTargetSlider
                value={[localSteps]}
                onValueChange={([value]) => {
                  setLocalSteps(value)
                  updateURL(URL_PARAMS.STEPS, value)
                }}
                min={2}
                max={16}
                step={1}
                className='w-full'
              />
              <div className='flex justify-between mt-4'>
                <span className='text-xs text-muted-foreground'>Few</span>
                <span className='text-xs text-muted-foreground'>Many</span>
              </div>
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate'>
                Step Duration
              </label>
              <span className='text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0'>
                {(localStepDuration * 100).toFixed(0)}%
              </span>
            </div>
            <div className='relative pt-1'>
              <WideTargetSlider
                value={[localStepDuration]}
                onValueChange={([value]) => {
                  setLocalStepDuration(value)
                  updateURL(URL_PARAMS.STEP_DURATION, value)
                }}
                min={0.1}
                max={0.5}
                step={0.05}
                className='w-full'
              />
              <div className='flex justify-between mt-4'>
                <span className='text-xs text-muted-foreground'>Quick</span>
                <span className='text-xs text-muted-foreground'>Slow</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
