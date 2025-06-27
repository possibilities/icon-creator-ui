import { calculateProjections, type PolygonData } from '@/lib/projection-engine'

export interface AnimationFrame {
  projections: PolygonData[]
  timestamp: number
  rotationAngle: number
}

export interface AnimationParams {
  rotationSpeed: number
  easingType: string
  easingStrength?: number
  overshoot?: number
  bounces?: number
  steps?: number
  stepDuration?: number
  pauseDuration?: number
  pauseMode?: 'none' | 'before' | 'after'
  direction: 'forward' | 'backward'
}

function easeLinear(t: number): number {
  return t
}

function easeInOut(t: number, strength: number = 2): number {
  if (t < 0.5) {
    return Math.pow(2 * t, strength) / 2
  } else {
    return 1 - Math.pow(2 * (1 - t), strength) / 2
  }
}

function easeElastic(
  t: number,
  overshoot: number = 20,
  bounces: number = 1,
): number {
  if (t === 0 || t === 1) return t
  const p = 1 / (bounces + 0.5)
  const a = overshoot / 360
  const s = (p / (2 * Math.PI)) * Math.asin(1 / (1 + a))
  return (
    1 + (1 + a) * Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p)
  )
}

function applyEasing(t: number, params: AnimationParams): number {
  switch (params.easingType) {
    case 'linear':
      return easeLinear(t)
    case 'ease-in-out':
      return easeInOut(t, params.easingStrength || 2)
    case 'elastic':
      return easeElastic(t, params.overshoot || 20, params.bounces || 1)
    default:
      return t
  }
}

export function captureAnimationFrames(
  vertices: number[][],
  faces: number[][],
  basePitch: number,
  baseYaw: number,
  baseRoll: number,
  gap: number,
  fov: number,
  animationParams: AnimationParams,
  frameRate: number = 30,
): AnimationFrame[] {
  const frames: AnimationFrame[] = []

  const degreesPerSecond = animationParams.rotationSpeed * 6
  const rotationDuration = 360 / degreesPerSecond
  const pauseDuration = animationParams.pauseDuration || 0
  const pauseMode = animationParams.pauseMode || 'none'
  const totalDuration = rotationDuration + pauseDuration
  const frameInterval = 1000 / frameRate
  const totalFrames = Math.ceil((totalDuration * 1000) / frameInterval)

  for (let i = 0; i < totalFrames; i++) {
    const timestamp = i * frameInterval
    const timeInSeconds = timestamp / 1000

    let rotationAngle = 0

    if (pauseMode === 'none' || pauseDuration === 0) {
      const progress = Math.min(timeInSeconds / rotationDuration, 1)
      const easedProgress = applyEasing(progress, animationParams)
      rotationAngle = easedProgress * 360

      if (animationParams.direction === 'backward') {
        rotationAngle = 360 - rotationAngle
      }
    } else if (pauseMode === 'after') {
      if (timeInSeconds < rotationDuration) {
        const progress = timeInSeconds / rotationDuration
        const easedProgress = applyEasing(progress, animationParams)
        rotationAngle = easedProgress * 360

        if (animationParams.direction === 'backward') {
          rotationAngle = 360 - rotationAngle
        }
      } else {
        rotationAngle = animationParams.direction === 'backward' ? 0 : 360
      }
    } else if (pauseMode === 'before') {
      if (timeInSeconds < pauseDuration) {
        rotationAngle = animationParams.direction === 'backward' ? 360 : 0
      } else {
        const timeForRotation = timeInSeconds - pauseDuration
        const progress = timeForRotation / rotationDuration
        const easedProgress = applyEasing(
          Math.min(progress, 1),
          animationParams,
        )
        rotationAngle = easedProgress * 360

        if (animationParams.direction === 'backward') {
          rotationAngle = 360 - rotationAngle
        }
      }
    }

    const animatedPitch = basePitch
    const animatedYaw = baseYaw + rotationAngle
    const animatedRoll = baseRoll

    const projections = calculateProjections({
      vertices,
      faces,
      pitch: animatedPitch,
      yaw: animatedYaw,
      roll: animatedRoll,
      gap,
      width: 400,
      height: 400,
      fov,
    })

    frames.push({
      projections,
      timestamp,
      rotationAngle,
    })
  }

  return frames
}
