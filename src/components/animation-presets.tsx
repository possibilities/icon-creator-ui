'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { URL_PARAMS } from '@/lib/viewer-params'

const animationPresets = [
  {
    name: 'Mechanical Loop',
    value: 'mechanical-loop',
    settings: {
      rotationSpeed: 30,
      easingType: 'linear',
      axisType: 'y',
      axisX: 0,
      axisY: 1,
      axisZ: 0,
      direction: 'forward',
    },
  },
  {
    name: 'Graceful Glide',
    value: 'graceful-glide',
    settings: {
      rotationSpeed: 20,
      easingType: 'ease-in-out',
      easingStrength: 2.5,
      axisType: 'y',
      axisX: 0,
      axisY: 1,
      axisZ: 0,
      direction: 'forward',
    },
  },
  {
    name: 'Playful Bounce',
    value: 'playful-bounce',
    settings: {
      rotationSpeed: 25,
      easingType: 'elastic',
      overshoot: 45,
      bounces: 3,
      axisType: 'y',
      axisX: 0,
      axisY: 1,
      axisZ: 0,
      direction: 'forward',
    },
  },
  {
    name: 'Tick Tock',
    value: 'tick-tock',
    settings: {
      rotationSpeed: 15,
      easingType: 'stepped',
      steps: 12,
      stepDuration: 0.15,
      axisType: 'y',
      axisX: 0,
      axisY: 1,
      axisZ: 0,
      direction: 'forward',
    },
  },
  {
    name: 'Spring Loaded',
    value: 'spring-loaded',
    settings: {
      rotationSpeed: 35,
      easingType: 'spring',
      overshoot: 30,
      axisType: 'y',
      axisX: 0,
      axisY: 1,
      axisZ: 0,
      direction: 'forward',
    },
  },
  {
    name: 'Whiplash',
    value: 'whiplash',
    settings: {
      rotationSpeed: 60,
      easingType: 'back',
      overshoot: 60,
      axisType: 'y',
      axisX: 0,
      axisY: 1,
      axisZ: 0,
      direction: 'forward',
    },
  },
  {
    name: 'Bouncy Ball',
    value: 'bouncy-ball',
    settings: {
      rotationSpeed: 40,
      easingType: 'bounce',
      bounces: 4,
      axisType: 'y',
      axisX: 0,
      axisY: 1,
      axisZ: 0,
      direction: 'forward',
    },
  },
  {
    name: 'Smooth Operator',
    value: 'smooth-operator',
    settings: {
      rotationSpeed: 25,
      easingType: 'ease-out',
      easingStrength: 2,
      axisType: 'y',
      axisX: 0,
      axisY: 1,
      axisZ: 0,
      direction: 'forward',
    },
  },
  {
    name: 'Vertical Tumble',
    value: 'vertical-tumble',
    settings: {
      rotationSpeed: 25,
      easingType: 'ease-in-out',
      easingStrength: 2,
      axisType: 'x',
      axisX: 1,
      axisY: 0,
      axisZ: 0,
      direction: 'forward',
    },
  },
  {
    name: 'Wheel Spin',
    value: 'wheel-spin',
    settings: {
      rotationSpeed: 40,
      easingType: 'linear',
      axisType: 'z',
      axisX: 0,
      axisY: 0,
      axisZ: 1,
      direction: 'forward',
    },
  },
  {
    name: 'Diagonal Roll',
    value: 'diagonal-roll',
    settings: {
      rotationSpeed: 30,
      easingType: 'ease-in-out',
      easingStrength: 1.5,
      axisType: 'custom',
      axisX: 0.7,
      axisY: 0.7,
      axisZ: 0,
      direction: 'forward',
    },
  },
  {
    name: 'Reverse Spin',
    value: 'reverse-spin',
    settings: {
      rotationSpeed: 20,
      easingType: 'ease-out',
      easingStrength: 2,
      axisType: 'y',
      axisX: 0,
      axisY: 1,
      axisZ: 0,
      direction: 'reverse',
    },
  },
]

export function AnimationPresets() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSpeed = parseFloat(searchParams.get(URL_PARAMS.SPEED) || '30')
  const currentEasing = searchParams.get(URL_PARAMS.EASING_TYPE) || 'linear'
  const currentEasingStrength = parseFloat(
    searchParams.get(URL_PARAMS.EASING_STRENGTH) || '1',
  )
  const currentOvershoot = parseFloat(
    searchParams.get(URL_PARAMS.OVERSHOOT) || '20',
  )
  const currentBounces = parseInt(searchParams.get(URL_PARAMS.BOUNCES) || '1')
  const currentSteps = parseInt(searchParams.get(URL_PARAMS.STEPS) || '8')
  const currentStepDuration = parseFloat(
    searchParams.get(URL_PARAMS.STEP_DURATION) || '0.2',
  )
  const currentAxisType = searchParams.get(URL_PARAMS.AXIS_TYPE) || 'y'
  const currentDirection = searchParams.get(URL_PARAMS.DIRECTION) || 'forward'

  const currentPreset =
    animationPresets.find(preset => {
      const settings = preset.settings
      return (
        Math.abs(settings.rotationSpeed - currentSpeed) < 0.01 &&
        settings.easingType === currentEasing &&
        (settings.easingStrength === undefined ||
          Math.abs(settings.easingStrength - currentEasingStrength) < 0.01) &&
        (settings.overshoot === undefined ||
          Math.abs(settings.overshoot - currentOvershoot) < 0.01) &&
        (settings.bounces === undefined ||
          settings.bounces === currentBounces) &&
        (settings.steps === undefined || settings.steps === currentSteps) &&
        (settings.stepDuration === undefined ||
          Math.abs(settings.stepDuration - currentStepDuration) < 0.01) &&
        settings.axisType === currentAxisType &&
        settings.direction === currentDirection
      )
    })?.value || 'custom'

  const handlePresetChange = (value: string) => {
    const preset = animationPresets.find(p => p.value === value)
    if (preset) {
      const params = new URLSearchParams(searchParams.toString())

      params.set(URL_PARAMS.SPEED, preset.settings.rotationSpeed.toString())
      params.set(URL_PARAMS.EASING_TYPE, preset.settings.easingType)
      params.set(URL_PARAMS.AXIS_TYPE, preset.settings.axisType)
      params.set(URL_PARAMS.AXIS_X, preset.settings.axisX.toString())
      params.set(URL_PARAMS.AXIS_Y, preset.settings.axisY.toString())
      params.set(URL_PARAMS.AXIS_Z, preset.settings.axisZ.toString())
      params.set(URL_PARAMS.DIRECTION, preset.settings.direction)
      params.set(URL_PARAMS.ANIMATION_PRESET, value)

      if (preset.settings.easingStrength !== undefined) {
        params.set(
          URL_PARAMS.EASING_STRENGTH,
          preset.settings.easingStrength.toString(),
        )
      }
      if (preset.settings.overshoot !== undefined) {
        params.set(URL_PARAMS.OVERSHOOT, preset.settings.overshoot.toString())
      }
      if (preset.settings.bounces !== undefined) {
        params.set(URL_PARAMS.BOUNCES, preset.settings.bounces.toString())
      }
      if (preset.settings.steps !== undefined) {
        params.set(URL_PARAMS.STEPS, preset.settings.steps.toString())
      }
      if (preset.settings.stepDuration !== undefined) {
        params.set(
          URL_PARAMS.STEP_DURATION,
          preset.settings.stepDuration.toString(),
        )
      }

      router.push(`?${params.toString()}`)
    }
  }

  return (
    <div className='flex flex-col gap-2'>
      <label className='text-sm text-muted-foreground'>Animation Preset</label>
      <Select value={currentPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className='w-full'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {animationPresets.map(preset => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.name}
            </SelectItem>
          ))}
          {currentPreset === 'custom' && (
            <SelectItem value='custom'>Custom</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
