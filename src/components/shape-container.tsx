'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ShapeSidebar from './shape-sidebar'
import ShapeViewer from './shape-viewer'
import { GAP_SIZE, FOV_DEFAULT, URL_PARAMS } from '@/lib/defaults'
import { debounce } from '@/lib/url-helpers'

interface ShapeContainerProps {
  shapes: string[]
  shapeName: string
  vertices: number[][]
  faces: number[][]
}

export default function ShapeContainer({
  shapes,
  shapeName,
  vertices,
  faces,
}: ShapeContainerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const getInitialValue = (param: string, defaultValue: number): number => {
    const value = searchParams.get(param)
    return value ? Number(value) : defaultValue
  }

  const [gap, setGap] = useState(() =>
    getInitialValue(URL_PARAMS.GAP, GAP_SIZE),
  )
  const [pitch, setPitch] = useState(() => getInitialValue(URL_PARAMS.PITCH, 0))
  const [yaw, setYaw] = useState(() => getInitialValue(URL_PARAMS.YAW, 0))
  const [roll, setRoll] = useState(() => getInitialValue(URL_PARAMS.ROLL, 0))
  const [fov, setFov] = useState(() =>
    getInitialValue(URL_PARAMS.FOV, FOV_DEFAULT),
  )

  const updateURL = useCallback(
    (updates: Record<string, number>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === 0 && key !== URL_PARAMS.GAP && key !== URL_PARAMS.FOV) {
          params.delete(key)
        } else if (value === GAP_SIZE && key === URL_PARAMS.GAP) {
          params.delete(key)
        } else if (value === FOV_DEFAULT && key === URL_PARAMS.FOV) {
          params.delete(key)
        } else {
          params.set(key, value.toString())
        }
      })

      router.push(`/${shapeName}?${params.toString()}`)
    },
    [router, searchParams, shapeName],
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
    })
  }, [gap, pitch, yaw, roll, fov, debouncedUpdateURL])

  return (
    <>
      <ShapeSidebar
        shapes={shapes}
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
        />
      </div>
    </>
  )
}
