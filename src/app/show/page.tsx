'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface PolygonData {
  faceIndex: number
  points: [number, number][]
}

export default function ShowPage() {
  const [inputData, setInputData] = useState('')
  const [polygons, setPolygons] = useState<PolygonData[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleVisualize = () => {
    setError(null)

    if (!inputData.trim()) {
      setError('Please paste polygon data')
      return
    }

    try {
      const parsed = JSON.parse(inputData)

      if (!Array.isArray(parsed)) {
        setError('Data must be an array of polygon objects')
        return
      }

      const isValid = parsed.every(
        item =>
          typeof item.faceIndex === 'number' &&
          Array.isArray(item.points) &&
          item.points.every(
            (point: unknown) =>
              Array.isArray(point) &&
              point.length === 2 &&
              typeof point[0] === 'number' &&
              typeof point[1] === 'number',
          ),
      )

      if (!isValid) {
        setError('Invalid polygon data format')
        return
      }

      setPolygons(parsed)
    } catch {
      setError('Invalid JSON format')
    }
  }

  const handleClear = () => {
    setInputData('')
    setPolygons([])
    setError(null)
  }

  const calculateViewBox = () => {
    if (polygons.length === 0) return '0 0 100 100'

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    polygons.forEach(polygon => {
      polygon.points.forEach(([x, y]) => {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      })
    })

    const padding = 50
    return `${minX - padding} ${minY - padding} ${maxX - minX + 2 * padding} ${maxY - minY + 2 * padding}`
  }

  const polygonToPath = (points: [number, number][]) => {
    if (points.length === 0) return ''
    return `M ${points.map(([x, y]) => `${x},${y}`).join(' L ')} Z`
  }

  return (
    <div className='flex h-screen'>
      <div className='w-1/2 p-8 border-r'>
        <h1 className='text-2xl font-bold mb-4'>Polygon Visualizer</h1>

        <div className='space-y-4'>
          <div>
            <label
              htmlFor='polygon-data'
              className='block text-sm font-medium mb-2'
            >
              Paste polygon data (JSON):
            </label>
            <Textarea
              id='polygon-data'
              value={inputData}
              onChange={e => setInputData(e.target.value)}
              placeholder='Paste your polygon data here...'
              className='h-96 font-mono text-xs'
            />
          </div>

          {error && <div className='text-destructive text-sm'>{error}</div>}

          <div className='flex gap-2'>
            <Button onClick={handleVisualize}>Visualize</Button>
            <Button variant='outline' onClick={handleClear}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      <div className='w-1/2 p-8 bg-muted/10'>
        {polygons.length > 0 ? (
          <svg
            viewBox={calculateViewBox()}
            className='w-full h-full bg-white dark:bg-black'
            preserveAspectRatio='xMidYMid meet'
          >
            {polygons.map((polygon, index) => (
              <path
                key={`${polygon.faceIndex}-${index}`}
                d={polygonToPath(polygon.points)}
                fill='black'
                className='dark:fill-white'
                stroke='none'
              />
            ))}
          </svg>
        ) : (
          <div className='flex items-center justify-center h-full text-muted-foreground'>
            <p>
              Paste polygon data and click &quot;Visualize&quot; to see the
              result
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
