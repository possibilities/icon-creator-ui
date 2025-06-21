'use client'

import { useEffect, useRef } from 'react'
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

  useEffect(() => {
    import('x3dom').then(() => {
      if (containerRef.current && window.x3dom) {
        window.x3dom.reload()
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

  return (
    <div
      ref={containerRef}
      className='w-full h-[600px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden'
    >
      <x3d style={{ width: '100%', height: '100%' }}>
        <scene>
          <viewpoint
            position='0 0 5'
            orientation='0 1 0 0'
            fieldofview='0.785398'
          ></viewpoint>
          {faces.map((face, index) => {
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

            return (
              <shape key={index}>
                <appearance>
                  <material
                    emissivecolor='0.6 0.8 1'
                    diffusecolor='0 0 0'
                  ></material>
                </appearance>
                <indexedfaceset solid='true' coordindex={faceIndices}>
                  <coordinate point={faceCoordinates}></coordinate>
                </indexedfaceset>
              </shape>
            )
          })}
        </scene>
      </x3d>
    </div>
  )
}
