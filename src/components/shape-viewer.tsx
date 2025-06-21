'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import 'x3dom/x3dom.css'

interface ShapeViewerProps {
  vertices: number[][]
  faces: number[][]
  edges: number[][]
  scaleFactor?: number
  viewType?: 'spacious' | 'cozy'
}

export default function ShapeViewer({
  vertices,
  faces,
  scaleFactor = 0.95,
  viewType = 'spacious',
}: ShapeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [foregroundColor, setForegroundColor] = useState('1 1 1')

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
  const fieldOfView = 0.785398
  const safetyFactor = viewType === 'spacious' ? 1.2 : 1.0
  const cameraDistance = (radius / Math.sin(fieldOfView / 2)) * safetyFactor
  const [dynamicCameraDistance, setDynamicCameraDistance] =
    useState(cameraDistance)

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

  const calculateCurrentBounds = useCallback(() => {
    const scaledVertices = faces.flatMap(face =>
      face.map(vertexIndex => {
        const vertex = vertices[vertexIndex]
        const faceCenter = calculateFaceCenter(face)
        return [
          faceCenter[0] + (vertex[0] - faceCenter[0]) * scaleFactor,
          faceCenter[1] + (vertex[1] - faceCenter[1]) * scaleFactor,
          faceCenter[2] + (vertex[2] - faceCenter[2]) * scaleFactor,
        ]
      }),
    )

    const maxCoord = scaledVertices.reduce((max, vertex) => {
      const absMax = Math.max(
        Math.abs(vertex[0]),
        Math.abs(vertex[1]),
        Math.abs(vertex[2]),
      )
      return Math.max(max, absMax)
    }, 0)

    return maxCoord
  }, [faces, vertices, scaleFactor, calculateFaceCenter])

  useEffect(() => {
    import('x3dom').then(() => {
      if (containerRef.current && window.x3dom) {
        window.x3dom.reload()

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
    })
  }, [])

  useEffect(() => {
    if (viewType === 'cozy') {
      const currentMaxRadius = calculateCurrentBounds()
      const cozyPadding = 0.1
      const fovRadians = fieldOfView
      const halfFov = fovRadians / 2
      const distanceNeeded =
        (currentMaxRadius + cozyPadding) / Math.tan(halfFov)
      setDynamicCameraDistance(distanceNeeded)
    } else {
      setDynamicCameraDistance(cameraDistance)
    }
  }, [
    viewType,
    vertices,
    faces,
    scaleFactor,
    fieldOfView,
    cameraDistance,
    calculateCurrentBounds,
  ])

  const x3dContent = `
    <x3d width="600px" height="600px" style="width: 100%; height: 100%; display: block;">
      <scene>
        <viewpoint position="0 0 ${viewType === 'cozy' ? dynamicCameraDistance : cameraDistance}" orientation="0 1 0 0" fieldofview="${fieldOfView}"></viewpoint>
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
  `

  return (
    <div className='w-full h-full flex items-center justify-center bg-background'>
      <div
        ref={containerRef}
        className='bg-background border border-border rounded-lg overflow-hidden'
        dangerouslySetInnerHTML={{ __html: x3dContent }}
      />
    </div>
  )
}
