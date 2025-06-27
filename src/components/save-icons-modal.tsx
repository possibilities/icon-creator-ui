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
import { Switch } from '@/components/ui/switch'
import { Download } from 'lucide-react'
import { calculateProjections, type PolygonData } from '@/lib/projection-engine'
import { generateFaviconSet, generateManifest } from '@/lib/icon-generator'
import JSZip from 'jszip'

interface SaveIconsModalProps {
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

export function SaveIconsModal({
  isOpen,
  onClose,
  vertices,
  faces,
  pitch,
  yaw,
  roll,
  gap,
  fov,
}: SaveIconsModalProps) {
  const [darkSelected, setDarkSelected] = useState(true)
  const [lightSelected, setLightSelected] = useState(true)
  const [includeWebIcons, setIncludeWebIcons] = useState(true)
  const [projections, setProjections] = useState<PolygonData[]>([])
  const [isDownloading, setIsDownloading] = useState(false)

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

    const padding = 0
    return `${minX - padding} ${minY - padding} ${maxX - minX + 2 * padding} ${maxY - minY + 2 * padding}`
  }

  const polygonToPath = (vertices: { x: number; y: number }[]): string => {
    if (vertices.length === 0) return ''
    return `M ${vertices.map(({ x, y }) => `${x},${y}`).join(' L ')} Z`
  }

  const frontFacingPolygons = projections.filter(p => p.front)
  const viewBox = calculateViewBox(frontFacingPolygons)

  const generateSVGString = (isDark: boolean): string => {
    const color = isDark ? '#fff' : '#000'

    const pathElements = frontFacingPolygons
      .map(polygon => {
        const pathData = polygonToPath(polygon.vertices)
        return `<path d="${pathData}" fill="${color}" stroke="none" />`
      })
      .join('\n  ')

    return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
  ${pathElements}
</svg>`
  }

  const handleSave = async () => {
    setIsDownloading(true)

    try {
      const shouldCreateZip = (lightSelected && darkSelected) || includeWebIcons

      if (shouldCreateZip) {
        const zip = new JSZip()
        const shapeName = '3D Icon'

        if (lightSelected) {
          const lightSvg = generateSVGString(false)
          zip.file('icon-light.svg', lightSvg)

          if (includeWebIcons) {
            const lightFolder = zip.folder('web-icons-light')
            if (lightFolder) {
              const lightIcons = await generateFaviconSet(lightSvg)
              for (const [filename, data] of Object.entries(lightIcons)) {
                if (filename === 'favicon.svg') {
                  lightFolder.file(filename, data)
                } else {
                  const base64Data = data.split(',')[1]
                  lightFolder.file(filename, base64Data, { base64: true })
                }
              }
            }
          }
        }

        if (darkSelected) {
          const darkSvg = generateSVGString(true)
          zip.file('icon-dark.svg', darkSvg)

          if (includeWebIcons) {
            const darkFolder = zip.folder('web-icons-dark')
            if (darkFolder) {
              const darkIcons = await generateFaviconSet(darkSvg)
              for (const [filename, data] of Object.entries(darkIcons)) {
                if (filename === 'favicon.svg') {
                  darkFolder.file(filename, data)
                } else {
                  const base64Data = data.split(',')[1]
                  darkFolder.file(filename, base64Data, { base64: true })
                }
              }
            }
          }
        }

        if (includeWebIcons) {
          zip.file('manifest.json', generateManifest(shapeName))
        }

        const blob = await zip.generateAsync({ type: 'blob' })
        const url = URL.createObjectURL(blob)
        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/[:.]/g, '-')
        const filename = `3d-icon-${timestamp}.zip`

        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()

        URL.revokeObjectURL(url)
      } else {
        const theme = lightSelected ? 'light' : 'dark'
        const svgString = generateSVGString(!lightSelected)
        const svgBlob = new Blob([svgString], {
          type: 'image/svg+xml;charset=utf-8',
        })
        const url = URL.createObjectURL(svgBlob)
        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/[:.]/g, '-')
        const filename = `3d-icon-${theme}-${timestamp}.svg`

        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()

        URL.revokeObjectURL(url)
      }

      onClose()
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }

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
          <DialogTitle>Save Icons</DialogTitle>
        </DialogHeader>

        <div className='grid grid-cols-2 gap-6 pt-6'>
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

        <div className='flex items-center justify-between px-1 pb-4'>
          <label
            htmlFor='web-icons'
            className='text-sm font-medium cursor-pointer select-none'
          >
            Include Web Icons
          </label>
          <Switch
            id='web-icons'
            checked={includeWebIcons}
            onCheckedChange={setIncludeWebIcons}
          />
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isDownloading || (!darkSelected && !lightSelected)}
          >
            <Download className='mr-1 h-4 w-4' />
            {isDownloading
              ? 'Downloading...'
              : (lightSelected && darkSelected) || includeWebIcons
                ? 'Download Archive'
                : 'Download Icon'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
