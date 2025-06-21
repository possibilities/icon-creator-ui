'use client'

import { useEffect, useRef, useState } from 'react'
import 'x3dom/x3dom.css'

interface ShapeViewerProps {
  vertices: number[][]
  faces: number[][]
  edges: number[][]
  scaleFactor?: number
}

export default function ShapeViewer({
  vertices,
  faces,
  scaleFactor = 0.8,
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

  const calculateFaceCenter = (face: number[]) => {
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
  }

  const x3dContent = `
    <x3d style="width: 100%; height: 100%;">
      <scene>
        <viewpoint position="0 0 3" orientation="0 1 0 0" fieldofview="0.785398"></viewpoint>
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
    <div
      ref={containerRef}
      className='w-full h-screen bg-background'
      dangerouslySetInnerHTML={{ __html: x3dContent }}
    />
  )
}
