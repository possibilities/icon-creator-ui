'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useTheme } from 'next-themes'
import { GAP_SIZE } from '@/lib/defaults'
import { gapToScaleFactor } from '@/lib/polyhedra-client'
import ClipperLib from 'clipper-lib'
import { cssVarToX3dColor } from '@/lib/color'

interface ShapeViewerProps {
  shapeName: string
  vertices: number[][]
  faces: number[][]
  gapSize?: number
  pitch?: number
  yaw?: number
  roll?: number
  fov?: number
}

export default function ShapeViewer({
  shapeName,
  vertices,
  faces,
  gapSize = GAP_SIZE,
  pitch = 0,
  yaw = 0,
  roll = 0,
  fov = 23,
}: ShapeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  interface X3DElement extends HTMLElement {
    runtime?: { resize?: () => void }
  }
  const [foregroundColor, setForegroundColor] = useState('1 1 1')
  const [cameraDistance, setCameraDistance] = useState(0)
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 })
  const [animatedGap, setAnimatedGap] = useState(gapSize)
  const animationRef = useRef<number | undefined>(undefined)
  const isFirstRenderRef = useRef(true)
  const viewMatrixRef = useRef<string | null>(null)
  const fieldOfView = (fov * Math.PI) / 180

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
  const safetyFactor = 1.0

  const updateCameraDistance = useCallback(() => {
    if (!parentRef.current) return
    const { width, height } = parentRef.current.getBoundingClientRect()
    const size = Math.min(width, height)
    setDimensions({ width: size, height: size })
    const aspect = 1
    const horizontalFov = 2 * Math.atan(Math.tan(fieldOfView / 2) * aspect)
    const verticalDist = radius / Math.sin(fieldOfView / 2)
    const horizontalDist = radius / Math.sin(horizontalFov / 2)
    setCameraDistance(Math.max(verticalDist, horizontalDist) * safetyFactor)
  }, [radius, fieldOfView, safetyFactor])

  const insetFace = useCallback(
    (face: number[], gap: number) => {
      if (face.length < 3) return face.map(idx => vertices[idx])

      const sub = (a: number[], b: number[]) => [
        a[0] - b[0],
        a[1] - b[1],
        a[2] - b[2],
      ]
      const add = (a: number[], b: number[]) => [
        a[0] + b[0],
        a[1] + b[1],
        a[2] + b[2],
      ]
      const mul = (v: number[], s: number) => [v[0] * s, v[1] * s, v[2] * s]
      const dot = (a: number[], b: number[]) =>
        a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
      const cross = (a: number[], b: number[]) => [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
      ]
      const norm = (v: number[]) => {
        const len = Math.sqrt(dot(v, v))
        return len === 0 ? v : mul(v, 1 / len)
      }

      const p0 = vertices[face[0]]
      const p1 = vertices[face[1]]
      const p2 = vertices[face[2]]

      const e1 = sub(p1, p0)
      const e2 = sub(p2, p0)
      const normal = norm(cross(e1, e2))
      const u = norm(e1)
      const v = norm(cross(normal, u))

      const to2D = (p: number[]) => {
        const vec = sub(p, p0)
        return { X: dot(vec, u), Y: dot(vec, v) }
      }
      const from2D = (pt: { X: number; Y: number }) =>
        add(p0, add(mul(u, pt.X), mul(v, pt.Y)))

      const path = face.map(idx => to2D(vertices[idx]))

      const edgeLens = path.map((pt, i) => {
        const n = path[(i + 1) % path.length]
        return Math.hypot(n.X - pt.X, n.Y - pt.Y)
      })
      const avgEdge = edgeLens.reduce((acc, l) => acc + l, 0) / edgeLens.length

      const scaleFactor = gapToScaleFactor(gap)
      const offset = avgEdge * (1 - scaleFactor)

      const scale = 100000
      const scaledPath = path.map(p => ({ X: p.X * scale, Y: p.Y * scale }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const co = new (ClipperLib as any).ClipperOffset()
      co.AddPath(
        scaledPath,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ClipperLib as any).JoinType.jtMiter,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ClipperLib as any).EndType.etClosedPolygon,
      )
      const res: { X: number; Y: number }[][] = []
      co.Execute(res, -offset * scale)
      const inset = (res[0] ?? scaledPath).map(p => ({
        X: p.X / scale,
        Y: p.Y / scale,
      }))

      return inset.map(from2D)
    },
    [vertices],
  )

  useEffect(() => {
    updateCameraDistance()
    window.addEventListener('resize', updateCameraDistance)
    return () => {
      window.removeEventListener('resize', updateCameraDistance)
    }
  }, [updateCameraDistance])

  useEffect(() => {
    let cancelled = false

    const viewpoint = containerRef.current?.querySelector('#camera') as
      | (HTMLElement & {
          _x3domNode?: {
            getCurrentTransform: () => { toString: () => string }
            setViewMatrix: (matrix: unknown) => void
          }
        })
      | null
    if (viewpoint && viewpoint._x3domNode) {
      const viewMatrix = viewpoint._x3domNode.getCurrentTransform()
      if (viewMatrix) {
        viewMatrixRef.current = viewMatrix.toString()
      }
    }

    cssVarToX3dColor('--foreground').then(x3dColor => {
      if (!cancelled) {
        setForegroundColor(x3dColor)

        const materials =
          containerRef.current?.querySelectorAll('.shape-material')
        if (materials) {
          materials.forEach(material => {
            material.setAttribute('emissivecolor', x3dColor)
          })
        }

        if (
          viewMatrixRef.current &&
          viewpoint &&
          viewpoint._x3domNode &&
          window.x3dom
        ) {
          setTimeout(() => {
            try {
              if (viewpoint._x3domNode && viewMatrixRef.current) {
                const values = viewMatrixRef.current
                  .split(/[\s,]+/)
                  .map(v => parseFloat(v))
                  .filter(v => !isNaN(v))

                if (values.length === 16 && window.x3dom?.fields?.SFMatrix4f) {
                  const matrix = new window.x3dom.fields.SFMatrix4f(
                    values[0],
                    values[1],
                    values[2],
                    values[3],
                    values[4],
                    values[5],
                    values[6],
                    values[7],
                    values[8],
                    values[9],
                    values[10],
                    values[11],
                    values[12],
                    values[13],
                    values[14],
                    values[15],
                  )
                  viewpoint._x3domNode.setViewMatrix(matrix)
                }
              }
            } catch (error) {
              console.warn('Failed to restore view matrix:', error)
            }
          }, 0)
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [theme])

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }

    const startGap = animatedGap
    const endGap = gapSize
    const duration = 300
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const currentGap = startGap + (endGap - startGap) * easeOutCubic

      setAnimatedGap(currentGap)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gapSize, animatedGap])

  const geometryContent = useMemo(() => {
    return faces
      .map(face => {
        const inset = insetFace(face, animatedGap)
        const faceCoordinates = inset.map(v => v.join(' ')).join(', ')
        const faceIndices = [...Array(inset.length).keys(), -1].join(' ')

        return `
          <shape>
            <appearance>
              <material class="shape-material" emissivecolor="${foregroundColor}" diffusecolor="0 0 0"></material>
            </appearance>
            <indexedfaceset solid="true" coordindex="${faceIndices}">
              <coordinate point="${faceCoordinates}"></coordinate>
            </indexedfaceset>
          </shape>
        `
      })
      .join('')
  }, [faces, insetFace, animatedGap, foregroundColor])

  useEffect(() => {
    if (!containerRef.current) return

    const existingScene = containerRef.current.querySelector('scene')

    if (!existingScene) {
      containerRef.current.innerHTML = `
        <x3d
          style='width: 100%; height: 100%; display: block;'
          disablekeys='true'
          disablerightdrag='true'
          disablemiddledrag='true'
          disabledoubleclick='true'
          disablecontextmenu='true'
          disablewheel='true'
        >
          <scene>
            <navigationinfo type='none' transitionType='"TELEPORT"' transitionTime='0'></navigationinfo>
            <viewpoint id='camera' orientation='0 1 0 0'></viewpoint>
            <transform rotation='1 0 0 ${(pitch * Math.PI) / 180}'>
              <transform rotation='0 1 0 ${(yaw * Math.PI) / 180}'>
                <transform rotation='0 0 1 ${(roll * Math.PI) / 180}'>
                  <group id='geometry-group'>
                    ${geometryContent}
                  </group>
                </transform>
              </transform>
            </transform>
          </scene>
        </x3d>
      `

      if (window.x3dom && typeof window.x3dom.reload === 'function') {
        window.x3dom.reload()
      }

      const styleId = 'x3dom-cursor-override'
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style')
        style.id = styleId
        style.textContent = `
          x3d, .x3dom-canvas, .x3dom-canvas-mousedown {
            cursor: default !important;
          }
        `
        document.head.appendChild(style)
      }

      const x3dElement = containerRef.current.querySelector(
        'x3d',
      ) as HTMLElement
      if (x3dElement) {
        const preventWheel = (e: Event) => {
          e.preventDefault()
          e.stopPropagation()
          return false
        }

        x3dElement.addEventListener('wheel', preventWheel, { passive: false })

        const canvas = x3dElement.querySelector('canvas') as HTMLCanvasElement
        if (canvas) {
          canvas.addEventListener('wheel', preventWheel, { passive: false })

          return () => {
            canvas.removeEventListener('wheel', preventWheel)
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapeName, pitch, yaw, roll])

  useEffect(() => {
    if (!containerRef.current) return

    const geometryGroup = containerRef.current.querySelector('#geometry-group')
    if (geometryGroup) {
      geometryGroup.innerHTML = geometryContent
      const x3d = containerRef.current.querySelector('x3d') as X3DElement
      if (x3d?.runtime && typeof x3d.runtime.resize === 'function') {
        x3d.runtime.resize()
      }
    }
  }, [geometryContent])

  useEffect(() => {
    if (!containerRef.current) return

    const transforms = containerRef.current.querySelectorAll('transform')
    if (transforms.length >= 3) {
      transforms[0].setAttribute('rotation', `1 0 0 ${(pitch * Math.PI) / 180}`)
      transforms[1].setAttribute('rotation', `0 1 0 ${(yaw * Math.PI) / 180}`)
      transforms[2].setAttribute('rotation', `0 0 1 ${(roll * Math.PI) / 180}`)
    }
  }, [pitch, yaw, roll])

  useEffect(() => {
    const x3dEl = containerRef.current?.querySelector(
      'x3d',
    ) as X3DElement | null
    const viewpoint = x3dEl?.querySelector('#camera') as HTMLElement | null
    if (x3dEl) {
      x3dEl.setAttribute('width', `${dimensions.width}px`)
      x3dEl.setAttribute('height', `${dimensions.height}px`)
    }
    if (viewpoint) {
      viewpoint.setAttribute('position', `0 0 ${cameraDistance}`)
      viewpoint.setAttribute('fieldOfView', `${fieldOfView}`)
    }
    if (x3dEl?.runtime && typeof x3dEl.runtime.resize === 'function') {
      x3dEl.runtime.resize()
    }
  }, [dimensions, cameraDistance, fieldOfView, fov])

  return (
    <div
      ref={parentRef}
      className='w-full h-full flex items-center justify-center bg-background'
    >
      <div
        ref={containerRef}
        className='bg-background overflow-hidden'
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
      />
    </div>
  )
}
