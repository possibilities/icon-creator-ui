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
import { type PolygonData } from '@/lib/projection-engine'
import {
  captureAnimationFrames,
  type AnimationParams,
} from '@/lib/animation-capture'
import { useSearchParams } from 'next/navigation'
import JSZip from 'jszip'
import GIF from 'gif.js'
import { URL_PARAMS } from '@/lib/viewer-params'

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
  const [isGeneratingGif, setIsGeneratingGif] = useState(false)
  const [darkGifUrl, setDarkGifUrl] = useState<string | null>(null)
  const [lightGifUrl, setLightGifUrl] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [gifKey, setGifKey] = useState(0)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (isOpen && vertices.length > 0 && faces.length > 0) {
      generateGifPreviews()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, vertices.length, faces.length])

  const generateGifPreviews = async () => {
    setIsGeneratingGif(true)

    const animationParams: AnimationParams = {
      rotationSpeed: Number(searchParams.get(URL_PARAMS.SPEED)) || 30,
      easingType: searchParams.get(URL_PARAMS.EASING_TYPE) || 'ease-in-out',
      easingStrength: Number(searchParams.get(URL_PARAMS.EASING_STRENGTH)) || 2,
      overshoot: Number(searchParams.get(URL_PARAMS.OVERSHOOT)) || 20,
      bounces: Number(searchParams.get(URL_PARAMS.BOUNCES)) || 1,
      steps: Number(searchParams.get(URL_PARAMS.STEPS)) || 8,
      stepDuration: Number(searchParams.get(URL_PARAMS.STEP_DURATION)) || 0.2,
      pauseDuration: Number(searchParams.get(URL_PARAMS.PAUSE_DURATION)) || 0,
      pauseMode: (searchParams.get(URL_PARAMS.PAUSE_MODE) || 'none') as
        | 'none'
        | 'before'
        | 'after',
      direction:
        searchParams.get(URL_PARAMS.DIRECTION) === 'reverse'
          ? 'backward'
          : 'forward',
    }

    const frames = captureAnimationFrames(
      vertices,
      faces,
      pitch,
      yaw,
      roll,
      gap,
      fov,
      animationParams,
      30,
    )

    let globalMinX = Infinity
    let globalMinY = Infinity
    let globalMaxX = -Infinity
    let globalMaxY = -Infinity

    frames.forEach(frame => {
      const frontFacing = frame.projections.filter(p => p.front)
      frontFacing.forEach(polygon => {
        polygon.vertices.forEach(({ x, y }) => {
          const roundedX = Math.round(x * 10) / 10
          const roundedY = Math.round(y * 10) / 10
          globalMinX = Math.min(globalMinX, roundedX)
          globalMinY = Math.min(globalMinY, roundedY)
          globalMaxX = Math.max(globalMaxX, roundedX)
          globalMaxY = Math.max(globalMaxY, roundedY)
        })
      })
    })

    const padding = 50
    const globalViewBox = `${globalMinX - padding} ${globalMinY - padding} ${globalMaxX - globalMinX + 2 * padding} ${globalMaxY - globalMinY + 2 * padding}`

    const generateGif = async (
      isDark: boolean,
      viewBox: string,
    ): Promise<string> => {
      return new Promise(async (resolve, reject) => {
        const gif = new GIF({
          workers: 2,
          quality: 10,
          width: 400,
          height: 400,
          workerScript: '/gif.worker.js',
        })

        const canvas = document.createElement('canvas')
        canvas.width = 400
        canvas.height = 400
        const ctx = canvas.getContext('2d')!

        let loadedFrames = 0

        for (const frame of frames) {
          const svgString = generateSVGString(
            frame.projections,
            isDark,
            viewBox,
          )

          await new Promise<void>(frameResolve => {
            const img = new Image()
            img.onload = () => {
              ctx.clearRect(0, 0, 400, 400)
              ctx.drawImage(img, 0, 0, 400, 400)
              gif.addFrame(ctx, { copy: true, delay: Math.round(1000 / 30) })
              URL.revokeObjectURL(img.src)

              loadedFrames++
              if (loadedFrames === frames.length) {
                gif.render()
              }
              frameResolve()
            }

            const svgBlob = new Blob([svgString], {
              type: 'image/svg+xml;charset=utf-8',
            })
            const svgUrl = URL.createObjectURL(svgBlob)
            img.src = svgUrl
          })
        }

        gif.on('finished', blob => {
          const url = URL.createObjectURL(blob)
          resolve(url)
        })

        gif.on('error', error => {
          console.error(`GIF generation error:`, error)
          reject(error)
        })
      })
    }

    try {
      const [darkUrl, lightUrl] = await Promise.all([
        generateGif(true, globalViewBox),
        generateGif(false, globalViewBox),
      ])

      setDarkGifUrl(darkUrl)
      setLightGifUrl(lightUrl)
      setGifKey(prev => prev + 1)
    } catch (error) {
      console.error('Failed to generate GIF previews:', error)
    } finally {
      setIsGeneratingGif(false)
    }
  }

  const handleSave = async () => {
    setIsDownloading(true)

    try {
      const shouldCreateZip = lightSelected && darkSelected

      if (shouldCreateZip) {
        const zip = new JSZip()

        if (lightSelected && lightGifUrl) {
          const response = await fetch(lightGifUrl)
          const blob = await response.blob()
          zip.file('animation-light.gif', blob)
        }

        if (darkSelected && darkGifUrl) {
          const response = await fetch(darkGifUrl)
          const blob = await response.blob()
          zip.file('animation-dark.gif', blob)
        }

        const blob = await zip.generateAsync({ type: 'blob' })
        const url = URL.createObjectURL(blob)
        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/[:.]/g, '-')
        const filename = `3d-animation-${timestamp}.zip`

        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()

        URL.revokeObjectURL(url)
      } else {
        const theme = lightSelected ? 'light' : 'dark'
        const gifUrl = lightSelected ? lightGifUrl : darkGifUrl

        if (gifUrl) {
          const response = await fetch(gifUrl)
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          const timestamp = new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/[:.]/g, '-')
          const filename = `3d-animation-${theme}-${timestamp}.gif`

          const a = document.createElement('a')
          a.href = url
          a.download = filename
          a.click()

          URL.revokeObjectURL(url)
        }
      }

      handleClose()
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleClose = () => {
    if (darkGifUrl) {
      URL.revokeObjectURL(darkGifUrl)
      setDarkGifUrl(null)
    }
    if (lightGifUrl) {
      URL.revokeObjectURL(lightGifUrl)
      setLightGifUrl(null)
    }
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
    return `M ${vertices.map(({ x, y }) => `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`).join(' L ')} Z`
  }

  const generateSVGString = (
    projectionData: PolygonData[],
    isDark: boolean,
    customViewBox?: string,
  ): string => {
    const color = isDark ? '#fff' : '#000'
    const bgColor = isDark ? '#000' : '#fff'
    const viewBoxStr =
      customViewBox || calculateViewBox(projectionData.filter(p => p.front))

    const frontFacing = projectionData.filter(p => p.front)
    const pathElements = frontFacing
      .map(polygon => {
        const pathData = polygonToPath(polygon.vertices)
        return `<path d="${pathData}" fill="${color}" stroke="none" />`
      })
      .join('\n  ')

    const [x, y, width, height] = viewBoxStr.split(' ').map(Number)

    return `<svg viewBox="${viewBoxStr}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${bgColor}" />
  ${pathElements}
</svg>`
  }

  const PreviewContent = ({ isDark }: { isDark: boolean }) => {
    const gifUrl = isDark ? darkGifUrl : lightGifUrl

    if (!gifUrl) {
      return (
        <div className='w-full h-full flex items-center justify-center bg-muted/50'>
          <p className='text-sm text-muted-foreground'>No preview available</p>
        </div>
      )
    }

    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={gifUrl}
          alt={`${isDark ? 'Dark' : 'Light'} mode animation`}
          className='w-full h-full object-contain'
          style={{
            backgroundColor: isDark ? '#000' : '#fff',
          }}
        />
      </>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-4xl'>
        <DialogHeader>
          <DialogTitle>Save Animation</DialogTitle>
        </DialogHeader>

        {isGeneratingGif ? (
          <div className='flex flex-col items-center justify-center py-16'>
            <div className='animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-4' />
            <p className='text-lg text-muted-foreground'>
              Generating animation...
            </p>
          </div>
        ) : (
          <>
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
                    <div className='aspect-square' key={`dark-${gifKey}`}>
                      <PreviewContent isDark={true} />
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
                    <div className='aspect-square' key={`light-${gifKey}`}>
                      <PreviewContent isDark={false} />
                    </div>
                  </div>
                  <div className='border-t' />
                  <div className='p-4 font-medium'>Light</div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button variant='outline' onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={(!darkSelected && !lightSelected) || isDownloading}
              >
                <Download className='mr-1 h-4 w-4' />
                {isDownloading ? 'Downloading...' : 'Save Animation'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
