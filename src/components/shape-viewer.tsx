'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { GAP_SIZE } from '@/lib/defaults'
import { gapToScaleFactor } from '@/lib/utils'

interface ShapeViewerProps {
  shapeName: string
  vertices: number[][]
  faces: number[][]
  gapSize?: number
}

let x3domScriptLoaded = false
let x3domCSSLoaded = false

function loadX3DOMScript(): Promise<{ success: boolean; error?: string }> {
  if (x3domScriptLoaded || typeof window === 'undefined') {
    return Promise.resolve({ success: true })
  }

  return new Promise(resolve => {
    const script = document.createElement('script')
    script.src = 'https://www.x3dom.org/release/x3dom.js'

    const timeout = setTimeout(() => {
      console.error('X3DOM script loading timeout')
      resolve({
        success: false,
        error: 'Loading timeout - X3DOM may be unavailable',
      })
    }, 10000)

    script.onload = () => {
      clearTimeout(timeout)
      x3domScriptLoaded = true
      resolve({ success: true })
    }

    script.onerror = () => {
      clearTimeout(timeout)
      console.error('Failed to load X3DOM from CDN')
      resolve({ success: false, error: 'Failed to load 3D viewer library' })
    }

    document.head.appendChild(script)

    if (!x3domCSSLoaded) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://www.x3dom.org/release/x3dom.css'
      document.head.appendChild(link)
      x3domCSSLoaded = true
    }
  })
}

export default function ShapeViewer({
  shapeName,
  vertices,
  faces,
  gapSize = GAP_SIZE,
}: ShapeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [foregroundColor, setForegroundColor] = useState('1 1 1')
  const [isReady, setIsReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const scaleFactor = gapToScaleFactor(gapSize)

  const rgbToX3d = (rgbString: string): string => {
    const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (!match) return '1 1 1'

    const r = parseInt(match[1]) / 255
    const g = parseInt(match[2]) / 255
    const b = parseInt(match[3]) / 255

    return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`
  }

  const calculateBoundingSphere = () => {
    const centroid = vertices.reduce(
      (acc, vertex) => [
        acc[0] + vertex[0] / vertices.length,
        acc[1] + vertex[1] / vertices.length,
        acc[2] + vertex[2] / vertices.length,
      ],
      [0, 0, 0],
    )

    const maxDistance = vertices.reduce((max, vertex) => {
      const distance = Math.sqrt(
        Math.pow(vertex[0] - centroid[0], 2) +
          Math.pow(vertex[1] - centroid[1], 2) +
          Math.pow(vertex[2] - centroid[2], 2),
      )
      return Math.max(max, distance)
    }, 0)

    return { centroid, radius: maxDistance }
  }

  const { radius } = calculateBoundingSphere()
  const fieldOfView = 0.785398
  const safetyFactor = 1.2
  const cameraDistance = (radius / Math.sin(fieldOfView / 2)) * safetyFactor

  const calculateFaceCenter = useCallback(
    (face: number[]) => {
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
    },
    [vertices],
  )

  useEffect(() => {
    loadX3DOMScript().then(result => {
      if (result.success) {
        setIsReady(true)
      } else {
        setLoadError(result.error || 'Unknown error loading 3D viewer')
      }
    })
  }, [])

  useEffect(() => {
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
  }, [])

  useEffect(() => {
    if (!isReady || !containerRef.current) return

    const sceneContent = faces
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
      .join('')

    containerRef.current.innerHTML = `
      <x3d width="600px" height="600px" style="width: 100%; height: 100%; display: block;">
        <scene>
          <viewpoint position="0 0 ${cameraDistance}" orientation="0 1 0 0" fieldofview="${fieldOfView}"></viewpoint>
          ${sceneContent}
        </scene>
      </x3d>
    `

    setTimeout(() => {
      if (window.x3dom && typeof window.x3dom.reload === 'function') {
        window.x3dom.reload()
      }
    }, 100)
  }, [
    shapeName,
    isReady,
    vertices,
    faces,
    scaleFactor,
    foregroundColor,
    cameraDistance,
    fieldOfView,
    calculateFaceCenter,
  ])

  if (loadError) {
    return (
      <div className='w-full h-full flex items-center justify-center bg-background'>
        <div className='text-center'>
          <div className='text-destructive mb-2'>Unable to load 3D viewer</div>
          <div className='text-sm text-muted-foreground'>{loadError}</div>
        </div>
      </div>
    )
  }

  if (!isReady) {
    return (
      <div className='w-full h-full flex items-center justify-center bg-background'>
        <div className='text-muted-foreground'>Loading 3D viewer...</div>
      </div>
    )
  }

  return (
    <div className='w-full h-full flex items-center justify-center bg-background'>
      <div
        ref={containerRef}
        className='bg-background border border-border rounded-lg overflow-hidden'
      />
    </div>
  )
}
