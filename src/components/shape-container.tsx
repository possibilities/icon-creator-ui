'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ShapeSidebar from './shape-sidebar'
import ShapeViewer from './shape-viewer'
import { GAP, FOV, SPEED, PITCH, YAW, ROLL } from '@/lib/viewer-defaults'
import { URL_PARAMS } from '@/lib/viewer-params'
import { debounce } from '@/lib/url-helpers'
import { wrapAngle } from '@/lib/rotation-utils'

interface ShapeContainerProps {
  shapes: string[]
  shapeName: string
  mode: string
  vertices: number[][]
  faces: number[][]
}

export default function ShapeContainer({
  shapes,
  shapeName,
  mode,
  vertices,
  faces,
}: ShapeContainerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const getInitialValue = (param: string, defaultValue: number): number => {
    const value = searchParams.get(param)
    return value ? Number(value) : defaultValue
  }

  const [gap, setGap] = useState(() => getInitialValue(URL_PARAMS.GAP, GAP))
  const [pitch, setPitch] = useState(() =>
    getInitialValue(URL_PARAMS.PITCH, PITCH),
  )
  const [yaw, setYaw] = useState(() => getInitialValue(URL_PARAMS.YAW, YAW))
  const [roll, setRoll] = useState(() => getInitialValue(URL_PARAMS.ROLL, ROLL))
  const [fov, setFov] = useState(() => getInitialValue(URL_PARAMS.FOV, FOV))
  const [speed] = useState(() => getInitialValue(URL_PARAMS.SPEED, SPEED))

  const updateURL = useCallback(
    (updates: Record<string, number>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === 0 &&
          key !== URL_PARAMS.GAP &&
          key !== URL_PARAMS.FOV &&
          key !== URL_PARAMS.SPEED
        ) {
          params.delete(key)
        } else if (value === GAP && key === URL_PARAMS.GAP) {
          params.delete(key)
        } else if (value === FOV && key === URL_PARAMS.FOV) {
          params.delete(key)
        } else if (value === SPEED && key === URL_PARAMS.SPEED) {
          params.delete(key)
        } else {
          params.set(key, value.toString())
        }
      })

      router.push(`/${shapeName}/${mode}?${params.toString()}`)
    },
    [router, searchParams, shapeName, mode],
  )

  const debouncedUpdateURL = useMemo(
    () =>
      debounce((updates: Record<string, number>) => {
        updateURL(updates)
      }, 300),
    [updateURL],
  )

  useEffect(() => {
    debouncedUpdateURL({
      [URL_PARAMS.GAP]: gap,
      [URL_PARAMS.PITCH]: pitch,
      [URL_PARAMS.YAW]: yaw,
      [URL_PARAMS.ROLL]: roll,
      [URL_PARAMS.FOV]: fov,
      [URL_PARAMS.SPEED]: speed,
    })
  }, [gap, pitch, yaw, roll, fov, speed, debouncedUpdateURL])

  useEffect(() => {
    const keysPressed = new Set<string>()
    let animationId: number | null = null
    let lastTime = 0

    const SPEED_DEGREES_PER_SECOND = 60

    const animate = (currentTime: number) => {
      if (lastTime === 0) {
        lastTime = currentTime
      }

      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime

      const step = SPEED_DEGREES_PER_SECOND * deltaTime

      if (keysPressed.has('K')) {
        setPitch(prev => Math.round(wrapAngle(prev - step)))
      }
      if (keysPressed.has('J')) {
        setPitch(prev => Math.round(wrapAngle(prev + step)))
      }
      if (keysPressed.has('H')) {
        setYaw(prev => Math.round(wrapAngle(prev - step)))
      }
      if (keysPressed.has('L')) {
        setYaw(prev => Math.round(wrapAngle(prev + step)))
      }
      if (keysPressed.has('P')) {
        setRoll(prev => Math.round(wrapAngle(prev - step)))
      }
      if (keysPressed.has('N')) {
        setRoll(prev => Math.round(wrapAngle(prev + step)))
      }

      if (keysPressed.size > 0) {
        animationId = requestAnimationFrame(animate)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.repeat) return

      const key = e.key.toUpperCase()

      if (key === 'Q') {
        e.preventDefault()
        setFov(prev => Math.max(1, prev - 1))
      } else if (key === 'W') {
        e.preventDefault()
        setFov(prev => Math.min(40, prev + 1))
      } else if (key === 'A') {
        e.preventDefault()
        setGap(prev => Math.max(1, prev - 1))
      } else if (key === 'S') {
        e.preventDefault()
        setGap(prev => Math.min(20, prev + 1))
      } else if (['K', 'J', 'H', 'L', 'P', 'N'].includes(key)) {
        e.preventDefault()
        keysPressed.add(key)

        if (!animationId) {
          lastTime = 0
          animationId = requestAnimationFrame(animate)
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()
      keysPressed.delete(key)

      if (keysPressed.size === 0 && animationId) {
        cancelAnimationFrame(animationId)
        animationId = null
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  return (
    <>
      <ShapeSidebar
        shapes={shapes}
        mode={mode}
        gap={gap}
        onGapChange={setGap}
        pitch={pitch}
        onPitchChange={setPitch}
        yaw={yaw}
        onYawChange={setYaw}
        roll={roll}
        onRollChange={setRoll}
        fov={fov}
        onFovChange={setFov}
      />
      <div className='w-full h-screen'>
        <ShapeViewer
          key={shapeName}
          shapeName={shapeName}
          vertices={vertices}
          faces={faces}
          gapSize={gap}
          pitch={pitch}
          yaw={yaw}
          roll={roll}
          fov={fov}
          speed={speed}
          mode={mode}
        />
      </div>
    </>
  )
}
