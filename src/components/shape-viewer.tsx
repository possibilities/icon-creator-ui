'use client'

import { useEffect, useRef } from 'react'
import 'x3dom/x3dom.css'

interface ShapeViewerProps {
  vertices: number[][]
  faces: number[][]
  edges: number[][]
}

export default function ShapeViewer({ vertices, faces }: ShapeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    import('x3dom').then(x3domModule => {
      if (containerRef.current) {
        x3domModule.reload()
      }
    })
  }, [])

  const coordinatePoints = vertices.map(vertex => vertex.join(' ')).join(', ')

  const faceIndices = faces.map(face => [...face, -1].join(' ')).join(' ')

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
            fieldOfView='0.785398'
          ></viewpoint>
          <shape>
            <appearance>
              <material
                emissiveColor='0.6 0.8 1'
                diffuseColor='0 0 0'
              ></material>
            </appearance>
            <indexedFaceSet solid='false' coordIndex={faceIndices}>
              <coordinate point={coordinatePoints}></coordinate>
            </indexedFaceSet>
          </shape>
        </scene>
      </x3d>
    </div>
  )
}
