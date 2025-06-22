'use client'

import { useState } from 'react'
import ShapeSidebar from './shape-sidebar'
import ShapeViewer from './shape-viewer'
import { GAP_SIZE } from '@/lib/defaults'

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
  const [gap, setGap] = useState(GAP_SIZE)

  return (
    <>
      <ShapeSidebar shapes={shapes} gap={gap} onGapChange={setGap} />
      <div className='w-full h-screen'>
        <ShapeViewer
          key={shapeName}
          shapeName={shapeName}
          vertices={vertices}
          faces={faces}
          gapSize={gap}
        />
      </div>
    </>
  )
}
