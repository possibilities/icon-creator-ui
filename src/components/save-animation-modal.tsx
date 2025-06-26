'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Download } from 'lucide-react'
import { calculateProjections, type PolygonData } from '@/lib/projection-engine'

interface SaveAnimationModalProps {
  isOpen: boolean
  onClose: () => void
  vertices: number[][]
  faces: number[][]
  pitch: number
  yaw: number
  roll: number
  gap: number
  fov: number
}

export function SaveAnimationModal({
  isOpen,
  onClose,
  vertices,
  faces,
  pitch,
  yaw,
  roll,
  gap,
  fov,
}: SaveAnimationModalProps) {
  const [darkSelected, setDarkSelected] = useState(true)
  const [lightSelected, setLightSelected] = useState(true)
  const [projections, setProjections] = useState<PolygonData[]>([])

  useEffect(() => {
    if (isOpen && vertices.length > 0 && faces.length > 0) {
      const newProjections = calculateProjections({
        vertices,
        faces,
        pitch,
        yaw,
        roll,
        gap,
        width: 400,
        height: 400,
        fov,
      })
      setProjections(newProjections)
    }
  }, [isOpen, vertices, faces, pitch, yaw, roll, gap, fov])

  const handleSave = () => {
    console.log('Saving animation...', { darkSelected, lightSelected })
    onClose()
  }

  const calculateViewBox = (polygons: PolygonData[]): string => {
    if (polygons.length === 0) return '0 0 100 100'

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    polygons.forEach(polygon => {
      polygon.vertices.forEach(({ x, y }) => {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      })
    })

    const padding = 50
    return `${minX - padding} ${minY - padding} ${maxX - minX + 2 * padding} ${maxY - minY + 2 * padding}`
  }

  const polygonToPath = (vertices: { x: number; y: number }[]): string => {
    if (vertices.length === 0) return ''
    return `M ${vertices.map(({ x, y }) => `${x},${y}`).join(' L ')} Z`
  }

  const frontFacingPolygons = projections.filter(p => p.front)
  const viewBox = calculateViewBox(frontFacingPolygons)

  const SVGPreview = ({ isDark }: { isDark: boolean }) => (
    <svg
      viewBox={viewBox}
      className='w-full h-full'
      style={{
        backgroundColor: isDark ? '#000' : '#fff',
      }}
      preserveAspectRatio='xMidYMid meet'
    >
      {frontFacingPolygons.map((polygon, index) => (
        <path
          key={`${polygon.faceIndex}-${index}`}
          d={polygonToPath(polygon.vertices)}
          fill={isDark ? '#fff' : '#000'}
          stroke='none'
        />
      ))}
    </svg>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl'>
        <DialogHeader>
          <DialogTitle>Save Animation</DialogTitle>
        </DialogHeader>

        <div className='grid grid-cols-2 gap-6 py-6'>
          <Card
            className='relative overflow-hidden cursor-pointer transition-colors hover:bg-accent/50'
            onClick={() => setDarkSelected(!darkSelected)}
          >
            <CardContent className='p-0'>
              <div className='flex justify-end px-4 pb-2'>
                <Checkbox
                  id='dark-mode'
                  checked={darkSelected}
                  onCheckedChange={checked => setDarkSelected(!!checked)}
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <div className='p-4 pt-2'>
                <div className='aspect-square'>
                  <SVGPreview isDark={true} />
                </div>
              </div>
              <div className='border-t' />
              <div className='p-4 font-medium'>Dark</div>
            </CardContent>
          </Card>

          <Card
            className='relative overflow-hidden cursor-pointer transition-colors hover:bg-accent/50'
            onClick={() => setLightSelected(!lightSelected)}
          >
            <CardContent className='p-0'>
              <div className='flex justify-end px-4 pb-2'>
                <Checkbox
                  id='light-mode'
                  checked={lightSelected}
                  onCheckedChange={checked => setLightSelected(!!checked)}
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <div className='p-4 pt-2'>
                <div className='aspect-square'>
                  <SVGPreview isDark={false} />
                </div>
              </div>
              <div className='border-t' />
              <div className='p-4 font-medium'>Light</div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!darkSelected && !lightSelected}
          >
            <Download className='mr-1 h-4 w-4' />
            Save Animation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
