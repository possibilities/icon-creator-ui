'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { GAP_SIZE, FIELD_OF_VIEW } from '@/lib/defaults'
import { gapToScaleFactor } from '@/lib/utils'

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
  const [foregroundColor, setForegroundColor] = useState('1 1 1')
  const [cameraDistance, setCameraDistance] = useState(0)
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 })
  const scaleFactor = gapToScaleFactor(gapSize)

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
    if (containerRef.current && window.x3dom) {
      window.x3dom.reload()
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
    }
    window.addEventListener('resize', updateCameraDistance)

    const parent = parentRef.current
    const resizeObserver = new ResizeObserver(() => {
      updateCameraDistance()
    })
    if (parent) resizeObserver.observe(parent)

    return () => {
      window.removeEventListener('resize', updateCameraDistance)
      resizeObserver.disconnect()
    }
  }, [updateCameraDistance])

  const x3dContent = useMemo(
    () => `
    <x3d width="${dimensions.width}px" height="${dimensions.height}px" style="width: 100%; height: 100%; display: block;">
      <scene>
        <viewpoint position="0 0 ${cameraDistance}" orientation="0 1 0 0" fieldofview="${fieldOfView}"></viewpoint>
        ${faces
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
          .join('')}
      </scene>
    </x3d>
  `,
    [
      dimensions.width,
      dimensions.height,
      cameraDistance,
      fieldOfView,
      faces,
      calculateFaceCenter,
      vertices,
      scaleFactor,
      foregroundColor,
    ],
  )

  useEffect(() => {
    if (!containerRef.current) return

    containerRef.current.innerHTML = x3dContent

    setTimeout(() => {
      if (window.x3dom && typeof window.x3dom.reload === 'function') {
        window.x3dom.reload()
      }
    }, 100)
  }, [x3dContent, shapeName])

  return (
    <div
      ref={parentRef}
      className='w-full h-full flex items-center justify-center bg-background'
    >
      <div
        ref={containerRef}
        className='bg-background border border-border rounded-lg overflow-hidden'
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
      />
    </div>
  )
}
