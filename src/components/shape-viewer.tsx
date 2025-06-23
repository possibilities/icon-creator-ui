'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { GAP_SIZE, FIELD_OF_VIEW } from '@/lib/defaults'
import { gapToScaleFactor } from '@/lib/polyhedra-client'

interface ShapeViewerProps {
  shapeName: string
  vertices: number[][]
  faces: number[][]
  gapSize?: number
}

export default function ShapeViewer({
  shapeName,
  vertices,
  faces,
  gapSize = GAP_SIZE,
}: ShapeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)
  interface X3DElement extends HTMLElement {
    runtime?: { resize?: () => void }
  }
  const [foregroundColor, setForegroundColor] = useState('1 1 1')
  const [cameraDistance, setCameraDistance] = useState(0)
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 })
  const [animatedGap, setAnimatedGap] = useState(gapSize)
  const animationRef = useRef<number | undefined>(undefined)
  const isFirstRenderRef = useRef(true)

  const rgbToX3d = (rgbString: string): string => {
    const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (!match) return '1 1 1'

    const r = parseInt(match[1]) / 255
    const g = parseInt(match[2]) / 255
    const b = parseInt(match[3]) / 255

    return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`
  }

  const calculateBoundingSphere = () => {
    const centroid = vertices.reduce(
      (acc, vertex) => [
        acc[0] + vertex[0] / vertices.length,
        acc[1] + vertex[1] / vertices.length,
        acc[2] + vertex[2] / vertices.length,
      ],
      [0, 0, 0],
    )

    const maxDistance = vertices.reduce((max, vertex) => {
      const distance = Math.sqrt(
        Math.pow(vertex[0] - centroid[0], 2) +
          Math.pow(vertex[1] - centroid[1], 2) +
          Math.pow(vertex[2] - centroid[2], 2),
      )
      return Math.max(max, distance)
    }, 0)

    return { centroid, radius: maxDistance }
  }

  const { radius } = calculateBoundingSphere()
  const fieldOfView = FIELD_OF_VIEW
  const safetyFactor = 1.0

  const updateCameraDistance = useCallback(() => {
    if (!parentRef.current) return
    const { width, height } = parentRef.current.getBoundingClientRect()
    const size = Math.min(width, height)
    setDimensions({ width: size, height: size })
    const aspect = 1
    const horizontalFov = 2 * Math.atan(Math.tan(fieldOfView / 2) * aspect)
    const verticalDist = radius / Math.sin(fieldOfView / 2)
    const horizontalDist = radius / Math.sin(horizontalFov / 2)
    setCameraDistance(Math.max(verticalDist, horizontalDist) * safetyFactor)
  }, [radius, fieldOfView, safetyFactor])

  const calculateFaceCenter = useCallback(
    (face: number[]) => {
      const faceVertices = face.map(index => vertices[index])
      const center = faceVertices.reduce(
        (acc, vertex) => [
          acc[0] + vertex[0] / faceVertices.length,
          acc[1] + vertex[1] / faceVertices.length,
          acc[2] + vertex[2] / faceVertices.length,
        ],
        [0, 0, 0],
      )
      return center
    },
    [vertices],
  )

  useEffect(() => {
    updateCameraDistance()

    const computedStyle = getComputedStyle(document.documentElement)
    const foreground = computedStyle.getPropertyValue('--foreground').trim()

    if (foreground) {
      const tempDiv = document.createElement('div')
      tempDiv.style.color = `oklch(${foreground})`
      document.body.appendChild(tempDiv)
      const rgbColor = getComputedStyle(tempDiv).color
      document.body.removeChild(tempDiv)

      setForegroundColor(rgbToX3d(rgbColor))
    }

    window.addEventListener('resize', updateCameraDistance)
    return () => window.removeEventListener('resize', updateCameraDistance)
  }, [updateCameraDistance])

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }

    const startGap = animatedGap
    const endGap = gapSize
    const duration = 300
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const currentGap = startGap + (endGap - startGap) * easeOutCubic

      setAnimatedGap(currentGap)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gapSize, animatedGap])

  const geometryContent = useMemo(() => {
    const scaleFactor = gapToScaleFactor(animatedGap)
    return faces
      .map(face => {
        const center = calculateFaceCenter(face)
        const faceCoordinates = face
          .map(vertexIndex => {
            const vertex = vertices[vertexIndex]
            const scaledVertex = [
              center[0] + (vertex[0] - center[0]) * scaleFactor,
              center[1] + (vertex[1] - center[1]) * scaleFactor,
              center[2] + (vertex[2] - center[2]) * scaleFactor,
            ]
            return scaledVertex.join(' ')
          })
          .join(', ')
        const faceIndices = [...Array(face.length).keys(), -1].join(' ')

        return `
          <shape>
            <appearance>
              <material emissivecolor="${foregroundColor}" diffusecolor="0 0 0"></material>
            </appearance>
            <indexedfaceset solid="true" coordindex="${faceIndices}">
              <coordinate point="${faceCoordinates}"></coordinate>
            </indexedfaceset>
          </shape>
        `
      })
      .join('')
  }, [faces, calculateFaceCenter, vertices, animatedGap, foregroundColor])

  useEffect(() => {
    if (!containerRef.current) return

    const existingScene = containerRef.current.querySelector('scene')

    if (existingScene) {
      const geometryGroup = existingScene.querySelector('#geometry-group')
      if (geometryGroup) {
        geometryGroup.innerHTML = geometryContent
        const x3d = containerRef.current.querySelector('x3d') as X3DElement
        if (x3d?.runtime && typeof x3d.runtime.resize === 'function') {
          x3d.runtime.resize()
        }
      }
    } else {
      containerRef.current.innerHTML = `
        <x3d
          style='width: 100%; height: 100%; display: block;'
          disablekeys='true'
          disablerightdrag='true'
          disablemiddledrag='true'
          disabledoubleclick='true'
          disablecontextmenu='true'
          disablewheel='true'
        >
          <scene>
            <navigationinfo type='examine' transitionType='"TELEPORT"' transitionTime='0'></navigationinfo>
            <viewpoint id='camera' orientation='0 1 0 0'></viewpoint>
            <group id='geometry-group'>
              ${geometryContent}
            </group>
          </scene>
        </x3d>
      `

      if (window.x3dom && typeof window.x3dom.reload === 'function') {
        window.x3dom.reload()
      }

      const x3dElement = containerRef.current.querySelector(
        'x3d',
      ) as HTMLElement
      if (x3dElement) {
        const preventWheel = (e: Event) => {
          e.preventDefault()
          e.stopPropagation()
          return false
        }

        x3dElement.addEventListener('wheel', preventWheel, { passive: false })

        const canvas = x3dElement.querySelector('canvas') as HTMLCanvasElement
        if (canvas) {
          canvas.addEventListener('wheel', preventWheel, { passive: false })
        }
      }
    }
  }, [geometryContent, shapeName])

  useEffect(() => {
    const x3dEl = containerRef.current?.querySelector(
      'x3d',
    ) as X3DElement | null
    const viewpoint = x3dEl?.querySelector('#camera') as HTMLElement | null
    if (x3dEl) {
      x3dEl.setAttribute('width', `${dimensions.width}px`)
      x3dEl.setAttribute('height', `${dimensions.height}px`)
    }
    if (viewpoint) {
      viewpoint.setAttribute('position', `0 0 ${cameraDistance}`)
      viewpoint.setAttribute('fieldOfView', `${fieldOfView}`)
    }
    if (x3dEl?.runtime && typeof x3dEl.runtime.resize === 'function') {
      x3dEl.runtime.resize()
    }
  }, [dimensions, cameraDistance, fieldOfView])

  return (
    <div
      ref={parentRef}
      className='w-full h-full flex items-center justify-center bg-background'
    >
      <div
        ref={containerRef}
        className='bg-background overflow-hidden'
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
      />
    </div>
  )
}
