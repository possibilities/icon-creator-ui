'use client'

import { useState } from 'react'
import ShapeSidebar from '@/components/shape-sidebar'
import ShapeViewer from '@/components/shape-viewer'
import { GAP_SIZE } from '@/lib/defaults'

interface ShapePageClientProps {
  shapeName: string
  vertices: number[][]
  faces: number[][]
  shapes: string[]
}

export default function ShapePageClient({
  shapeName,
  vertices,
  faces,
  shapes,
}: ShapePageClientProps) {
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
