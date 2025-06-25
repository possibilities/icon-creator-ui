'use client'

import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'

interface PolygonData {
  faceIndex: number
  vertices: { x: number; y: number }[]
  front: boolean
}

export default function ShowPage() {
  const [polygons, setPolygons] = useState<PolygonData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showOnlyFront, setShowOnlyFront] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const loadFromLocalStorage = () => {
    setError(null)

    try {
      const data = localStorage.getItem('shapeViewerProjections')
      if (!data) {
        setError(
          'No projection data found. Navigate to a polyhedra shape to generate data.',
        )
        setPolygons([])
        return
      }

      const parsed = JSON.parse(data)

      if (!Array.isArray(parsed)) {
        setError('Invalid data format in localStorage')
        setPolygons([])
        return
      }

      const isValid = parsed.every(
        item =>
          typeof item.faceIndex === 'number' &&
          typeof item.front === 'boolean' &&
          Array.isArray(item.vertices) &&
          item.vertices.every(
            (vertex: unknown) =>
              typeof vertex === 'object' &&
              vertex !== null &&
              'x' in vertex &&
              'y' in vertex &&
              typeof vertex.x === 'number' &&
              typeof vertex.y === 'number',
          ),
      )

      if (!isValid) {
        setError('Invalid polygon data format in localStorage.')
        setPolygons([])
        return
      }

      setPolygons(parsed)
      setLastUpdate(new Date())
    } catch (e) {
      setError('Failed to load projection data: ' + (e as Error).message)
      setPolygons([])
    }
  }

  useEffect(() => {
    loadFromLocalStorage()

    const handleStorageChange = (e: StorageEvent | Event) => {
      if (e instanceof StorageEvent && e.key !== 'shapeViewerProjections')
        return
      loadFromLocalStorage()
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const calculateViewBox = () => {
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

  const polygonToPath = (vertices: { x: number; y: number }[]) => {
    if (vertices.length === 0) return ''
    return `M ${vertices.map(({ x, y }) => `${x},${y}`).join(' L ')} Z`
  }

  return (
    <div className='flex h-screen'>
      <div className='w-1/3 p-8 border-r'>
        <h1 className='text-2xl font-bold mb-4'>
          Shape Viewer Projection Visualizer
        </h1>

        <div className='space-y-4'>
          <div className='p-4 bg-muted rounded-lg'>
            <h2 className='text-sm font-medium mb-2'>Status</h2>
            {polygons.length > 0 ? (
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>
                  Visualizing {polygons.length} polygons
                </p>
                <p className='text-sm text-muted-foreground'>
                  {polygons.filter(p => p.front).length} front-facing
                </p>
                {lastUpdate && (
                  <p className='text-xs text-muted-foreground'>
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </p>
                )}
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>
                Waiting for projection data...
              </p>
            )}
          </div>

          {error && (
            <div className='p-3 bg-destructive/10 text-destructive rounded-lg text-sm'>
              {error}
            </div>
          )}

          <div className='p-4 bg-muted/50 rounded-lg'>
            <h2 className='text-sm font-medium mb-2'>Instructions</h2>
            <ol className='text-sm text-muted-foreground space-y-1 list-decimal list-inside'>
              <li>Navigate to a polyhedra shape page</li>
              <li>The projection data will automatically appear here</li>
              <li>Use the checkbox below to toggle visibility</li>
            </ol>
          </div>

          <div className='flex items-center gap-2'>
            <Checkbox
              id='show-front'
              checked={showOnlyFront}
              onCheckedChange={checked => setShowOnlyFront(checked as boolean)}
            />
            <label
              htmlFor='show-front'
              className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            >
              Show only front-facing polygons
            </label>
          </div>
        </div>
      </div>

      <div className='w-2/3 p-8 bg-muted/10'>
        {polygons.length > 0 ? (
          <svg
            viewBox={calculateViewBox()}
            className='w-full h-full bg-white dark:bg-black'
            preserveAspectRatio='xMidYMid meet'
          >
            {polygons
              .filter(polygon => !showOnlyFront || polygon.front)
              .map((polygon, index) => (
                <path
                  key={`${polygon.faceIndex}-${index}`}
                  d={polygonToPath(polygon.vertices)}
                  fill={polygon.front ? 'black' : 'gray'}
                  className={
                    polygon.front ? 'dark:fill-white' : 'dark:fill-gray-600'
                  }
                  stroke='none'
                  opacity={polygon.front ? 1 : 0.3}
                />
              ))}
          </svg>
        ) : (
          <div className='flex items-center justify-center h-full text-muted-foreground'>
            <div className='text-center space-y-2'>
              <p className='text-lg'>No projection data available</p>
              <p className='text-sm'>
                Navigate to a polyhedra shape to see its 2D projection
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
