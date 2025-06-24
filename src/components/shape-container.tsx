'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ShapeSidebar from './shape-sidebar'
import ShapeViewer from './shape-viewer'
import { GAP, FOV, SPEED, PITCH, YAW, ROLL } from '@/lib/viewer-defaults'
import { URL_PARAMS } from '@/lib/viewer-params'
import { debounce } from '@/lib/url-helpers'

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
  const [speed, setSpeed] = useState(() =>
    getInitialValue(URL_PARAMS.SPEED, SPEED),
  )

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
        speed={speed}
        onSpeedChange={setSpeed}
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
