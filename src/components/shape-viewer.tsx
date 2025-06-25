'use client'

import { useEffect, useRef, useState, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react'
import { useTheme } from 'next-themes'
import { useSearchParams } from 'next/navigation'
import { GAP, FOV, SPEED, PITCH, YAW, ROLL } from '@/lib/viewer-defaults'
import { URL_PARAMS } from '@/lib/viewer-params'
import { gapToScaleFactor } from '@/lib/polyhedra-client'
import ClipperLib from 'clipper-lib'
import { cssVarToX3dColor } from '@/lib/color'
import { wrapAngle } from '@/lib/rotation-utils'

interface PolygonData {
  faceIndex: number
  vertices: { x: number; y: number }[]
  front: boolean
}

interface ShapeViewerProps {
  shapeName: string
  vertices: number[][]
  faces: number[][]
  gapSize?: number
  pitch?: number
  yaw?: number
  roll?: number
  fov?: number
  speed?: number
  mode?: string
  onProjectionsComputed?: (projections: PolygonData[]) => void
}

export interface ShapeViewerHandle {
  calculateProjections: () => PolygonData[]
}

const ShapeViewer = forwardRef<ShapeViewerHandle, ShapeViewerProps>((
  {
    shapeName,
    vertices,
    faces,
    gapSize = GAP,
    pitch = PITCH,
    yaw = YAW,
    roll = ROLL,
    fov = FOV,
    speed = SPEED,
    mode = 'scene',
    onProjectionsComputed,
  },
  ref
) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const searchParams = useSearchParams()
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
  const [animatedYaw, setAnimatedYaw] = useState(yaw)
  const [animatedPitch, setAnimatedPitch] = useState(pitch)
  const [animatedRoll, setAnimatedRoll] = useState(roll)
  const motionAnimationRef = useRef<number | undefined>(undefined)
  const lastTimeRef = useRef<number>(0)
  const rotationProgressRef = useRef<number>(0)
  const pauseStartTimeRef = useRef<number>(0)
  const cycleCountRef = useRef<number>(0)
  const totalRotationRef = useRef<{ pitch: number; yaw: number; roll: number }>(
    { pitch: 0, yaw: 0, roll: 0 },
  )
  const animationStartTimeRef = useRef<number>(0)
  const totalPausedTimeRef = useRef<number>(0)

  const getAnimationParams = useCallback(() => {
    return {
      easingType: searchParams.get(URL_PARAMS.EASING_TYPE) || 'linear',
      easingStrength: parseFloat(
        searchParams.get(URL_PARAMS.EASING_STRENGTH) || '1',
      ),
      overshoot: parseFloat(searchParams.get(URL_PARAMS.OVERSHOOT) || '20'),
      bounces: parseInt(searchParams.get(URL_PARAMS.BOUNCES) || '1'),
      steps: parseInt(searchParams.get(URL_PARAMS.STEPS) || '8'),
      stepDuration: parseFloat(
        searchParams.get(URL_PARAMS.STEP_DURATION) || '0.2',
      ),
      axisType: searchParams.get(URL_PARAMS.AXIS_TYPE) || 'y',
      axisX: parseFloat(searchParams.get(URL_PARAMS.AXIS_X) || '0'),
      axisY: parseFloat(searchParams.get(URL_PARAMS.AXIS_Y) || '1'),
      axisZ: parseFloat(searchParams.get(URL_PARAMS.AXIS_Z) || '0'),
      direction: searchParams.get(URL_PARAMS.DIRECTION) || 'forward',
      pauseDuration: parseFloat(
        searchParams.get(URL_PARAMS.PAUSE_DURATION) || '0',
      ),
      repeatCount: parseInt(searchParams.get(URL_PARAMS.REPEAT_COUNT) || '1'),
    }
  }, [searchParams])

  const easingFunctions = useMemo(
    () => ({
      linear: (t: number) => t,
      'ease-in': (t: number, strength = 1) => Math.pow(t, 1 + strength),
      'ease-out': (t: number, strength = 1) =>
        1 - Math.pow(1 - t, 1 + strength),
      'ease-in-out': (t: number, strength = 1) => {
        if (t < 0.5) {
          return Math.pow(2 * t, 1 + strength) / 2
        } else {
          return 1 - Math.pow(2 * (1 - t), 1 + strength) / 2
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      elastic: (t: number, _overshoot = 20, bounces = 1) => {
        if (t === 0 || t === 1) return t
        const p = 0.3 * bounces
        const s = p / 4
        const postFix =
          Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p)
        return postFix + 1
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      bounce: (t: number, _bounces = 1) => {
        const n1 = 7.5625
        const d1 = 2.75

        if (t < 1 / d1) {
          return n1 * t * t
        } else if (t < 2 / d1) {
          return n1 * (t -= 1.5 / d1) * t + 0.75
        } else if (t < 2.5 / d1) {
          return n1 * (t -= 2.25 / d1) * t + 0.9375
        } else {
          return n1 * (t -= 2.625 / d1) * t + 0.984375
        }
      },
      back: (t: number, overshoot = 20) => {
        const s = overshoot / 100
        return t * t * ((s + 1) * t - s)
      },
      stepped: (t: number, steps = 8, stepDuration = 0.2) => {
        const stepProgress = t * steps
        const currentStep = Math.floor(stepProgress)
        const stepFraction = stepProgress - currentStep

        if (stepFraction < stepDuration) {
          return currentStep / steps
        } else {
          return (currentStep + 1) / steps
        }
      },
      spring: (t: number, overshoot = 20) => {
        const damping = 0.3
        const initialAmplitude = overshoot / 100
        return (
          1 +
          Math.exp(-damping * t * 10) *
            initialAmplitude *
            Math.sin(t * 10 * Math.PI)
        )
      },
    }),
    [],
  )

  const projectVertex = useCallback(
    (v: number[]) => {
      const radPitch = (animatedPitch * Math.PI) / 180
      const radYaw = (animatedYaw * Math.PI) / 180
      const radRoll = (animatedRoll * Math.PI) / 180

      const cx = Math.cos(radPitch)
      const sx = Math.sin(radPitch)
      const cy = Math.cos(radYaw)
      const sy = Math.sin(radYaw)
      const cz = Math.cos(radRoll)
      const sz = Math.sin(radRoll)

      const x = v[0]
      const y = v[1]
      const z = v[2]

      const x1 = x * cz - y * sz
      const y1 = x * sz + y * cz
      const z1 = z

      const x2 = x1 * cy + z1 * sy
      const y2 = y1
      const z2 = -x1 * sy + z1 * cy

      const x3 = x2
      const y3 = y2 * cx - z2 * sx
      const z3 = y2 * sx + z2 * cx

      const zc = z3 - cameraDistance
      const f = 1 / Math.tan(fieldOfView / 2)

      const ndcX = (x3 * f) / -zc
      const ndcY = (y3 * f) / -zc

      return {
        x: (ndcX + 1) * (dimensions.width / 2),
        y: (1 - ndcY) * (dimensions.height / 2),
        pos: [x3, y3, z3] as [number, number, number],
      }
    },
    [
      animatedPitch,
      animatedYaw,
      animatedRoll,
      cameraDistance,
      fieldOfView,
      dimensions,
    ],
  )

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

  const calculateFaceProjections = useCallback(() => {
    const facesInfo = faces.map((face, i) => {
      const insetVerts = insetFace(face, animatedGap)

      const verts3d = insetVerts.map(v => projectVertex(v).pos)
      const verts2d = insetVerts.map(v => {
        const { x, y } = projectVertex(v)
        return { x, y }
      })

      const centroid = verts3d.reduce(
        (acc, v) => [acc[0] + v[0], acc[1] + v[1], acc[2] + v[2]],
        [0, 0, 0],
      )
      centroid[0] /= verts3d.length
      centroid[1] /= verts3d.length
      centroid[2] /= verts3d.length

      const a = verts3d[0]
      const b = verts3d[1]
      const c = verts3d[2]
      const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
      const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
      const normal = [
        ab[1] * ac[2] - ab[2] * ac[1],
        ab[2] * ac[0] - ab[0] * ac[2],
        ab[0] * ac[1] - ab[1] * ac[0],
      ]
      const toCamera = [
        -centroid[0],
        -centroid[1],
        cameraDistance - centroid[2],
      ]
      const dot =
        normal[0] * toCamera[0] +
        normal[1] * toCamera[1] +
        normal[2] * toCamera[2]

      return { faceIndex: i, vertices: verts2d, front: dot > 0 }
    })

    return facesInfo
  }, [
    faces,
    projectVertex,
    cameraDistance,
    animatedGap,
    insetFace,
  ])

  useImperativeHandle(ref, () => ({
    calculateProjections: () => {
      const projections = calculateFaceProjections()
      if (onProjectionsComputed) {
        onProjectionsComputed(projections)
      }
      return projections
    },
  }), [calculateFaceProjections, onProjectionsComputed])

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
              if (
                viewpoint._x3domNode &&
                viewMatrixRef.current &&
                typeof viewpoint._x3domNode.setViewMatrix === 'function'
              ) {
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
              console.error('Failed to restore view matrix:', error)
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
  }, [gapSize]) // eslint-disable-line react-hooks/exhaustive-deps

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
            <transform rotation='1 0 0 ${(animatedPitch * Math.PI) / 180}'>
              <transform rotation='0 1 0 ${(animatedYaw * Math.PI) / 180}'>
                <transform rotation='0 0 1 ${(animatedRoll * Math.PI) / 180}'>
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
  }, [shapeName, pitch, yaw, roll, animatedGap])

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
    if (motionAnimationRef.current) {
      cancelAnimationFrame(motionAnimationRef.current)
      motionAnimationRef.current = undefined
    }

    if (mode === 'motion' && speed > 0) {
      const animParams = getAnimationParams()
      const startTime = performance.now()
      lastTimeRef.current = startTime
      animationStartTimeRef.current = startTime
      rotationProgressRef.current = 0
      pauseStartTimeRef.current = 0
      cycleCountRef.current = 0
      totalRotationRef.current = { pitch: 0, yaw: 0, roll: 0 }
      totalPausedTimeRef.current = 0

      const animate = (currentTime: number) => {
        const deltaTime = (currentTime - lastTimeRef.current) / 1000
        lastTimeRef.current = currentTime

        if (animParams.pauseDuration > 0 && pauseStartTimeRef.current > 0) {
          const pauseElapsed = (currentTime - pauseStartTimeRef.current) / 1000
          if (pauseElapsed < animParams.pauseDuration) {
            motionAnimationRef.current = requestAnimationFrame(animate)
            return
          } else {
            totalPausedTimeRef.current += pauseElapsed * 1000
            pauseStartTimeRef.current = 0
          }
        }

        const rotationSpeed =
          speed * (animParams.direction === 'reverse' ? -1 : 1)
        const degreesPerSecond = rotationSpeed * 6

        if (animParams.easingType === 'linear') {
          const rotationDelta = degreesPerSecond * deltaTime

          if (animParams.axisType === 'x') {
            totalRotationRef.current.pitch += rotationDelta
            setAnimatedPitch(wrapAngle(pitch + totalRotationRef.current.pitch))
            setAnimatedYaw(yaw)
            setAnimatedRoll(roll)
          } else if (animParams.axisType === 'y') {
            totalRotationRef.current.yaw += rotationDelta
            setAnimatedPitch(pitch)
            setAnimatedYaw(wrapAngle(yaw + totalRotationRef.current.yaw))
            setAnimatedRoll(roll)
          } else if (animParams.axisType === 'z') {
            totalRotationRef.current.roll += rotationDelta
            setAnimatedPitch(pitch)
            setAnimatedYaw(yaw)
            setAnimatedRoll(wrapAngle(roll + totalRotationRef.current.roll))
          } else if (animParams.axisType === 'custom') {
            const magnitude = Math.sqrt(
              animParams.axisX * animParams.axisX +
                animParams.axisY * animParams.axisY +
                animParams.axisZ * animParams.axisZ,
            )
            if (magnitude > 0) {
              const normalizedX = animParams.axisX / magnitude
              const normalizedY = animParams.axisY / magnitude
              const normalizedZ = animParams.axisZ / magnitude

              totalRotationRef.current.pitch += rotationDelta * normalizedX
              totalRotationRef.current.yaw += rotationDelta * normalizedY
              totalRotationRef.current.roll += rotationDelta * normalizedZ

              setAnimatedPitch(
                wrapAngle(pitch + totalRotationRef.current.pitch),
              )
              setAnimatedYaw(wrapAngle(yaw + totalRotationRef.current.yaw))
              setAnimatedRoll(wrapAngle(roll + totalRotationRef.current.roll))
            }
          }

          if (animParams.pauseDuration > 0 && pauseStartTimeRef.current === 0) {
            const totalRotation = Math.abs(
              animParams.axisType === 'x'
                ? totalRotationRef.current.pitch
                : animParams.axisType === 'y'
                  ? totalRotationRef.current.yaw
                  : animParams.axisType === 'z'
                    ? totalRotationRef.current.roll
                    : Math.sqrt(
                        totalRotationRef.current.pitch ** 2 +
                          totalRotationRef.current.yaw ** 2 +
                          totalRotationRef.current.roll ** 2,
                      ),
            )
            const completedCycles = Math.floor(totalRotation / 360)
            if (completedCycles > cycleCountRef.current) {
              cycleCountRef.current = completedCycles
              if (cycleCountRef.current % animParams.repeatCount === 0) {
                pauseStartTimeRef.current = currentTime
              }
            }
          }
        } else {
          const elapsedTime =
            (currentTime -
              animationStartTimeRef.current -
              totalPausedTimeRef.current) /
            1000

          const targetRotations = (speed / 60) * elapsedTime

          const currentRotationProgress = targetRotations % 1

          const easingFunc =
            easingFunctions[
              animParams.easingType as keyof typeof easingFunctions
            ] || easingFunctions.linear
          let easedProgress = currentRotationProgress

          switch (animParams.easingType) {
            case 'ease-in':
            case 'ease-out':
            case 'ease-in-out':
              easedProgress = easingFunc(
                currentRotationProgress,
                animParams.easingStrength,
              )
              break
            case 'elastic':
              easedProgress = easingFunc(
                currentRotationProgress,
                animParams.overshoot,
                animParams.bounces,
              )
              break
            case 'bounce':
              easedProgress = easingFunc(
                currentRotationProgress,
                animParams.bounces,
              )
              break
            case 'back':
            case 'spring':
              easedProgress = easingFunc(
                currentRotationProgress,
                animParams.overshoot,
              )
              break
            case 'stepped':
              easedProgress = easingFunc(
                currentRotationProgress,
                animParams.steps,
                animParams.stepDuration,
              )
              break
            default:
              easedProgress = easingFunc(currentRotationProgress)
          }

          const completedRotations = Math.floor(targetRotations)
          const directionMultiplier =
            animParams.direction === 'reverse' ? -1 : 1
          const rotationAngle =
            (completedRotations * 360 + easedProgress * 360) *
            directionMultiplier

          if (animParams.axisType === 'x') {
            totalRotationRef.current.pitch = rotationAngle
            setAnimatedPitch(wrapAngle(pitch + totalRotationRef.current.pitch))
            setAnimatedYaw(yaw)
            setAnimatedRoll(roll)
          } else if (animParams.axisType === 'y') {
            totalRotationRef.current.yaw = rotationAngle
            setAnimatedPitch(pitch)
            setAnimatedYaw(wrapAngle(yaw + totalRotationRef.current.yaw))
            setAnimatedRoll(roll)
          } else if (animParams.axisType === 'z') {
            totalRotationRef.current.roll = rotationAngle
            setAnimatedPitch(pitch)
            setAnimatedYaw(yaw)
            setAnimatedRoll(wrapAngle(roll + totalRotationRef.current.roll))
          } else if (animParams.axisType === 'custom') {
            const magnitude = Math.sqrt(
              animParams.axisX * animParams.axisX +
                animParams.axisY * animParams.axisY +
                animParams.axisZ * animParams.axisZ,
            )
            if (magnitude > 0) {
              const normalizedX = animParams.axisX / magnitude
              const normalizedY = animParams.axisY / magnitude
              const normalizedZ = animParams.axisZ / magnitude

              totalRotationRef.current.pitch = rotationAngle * normalizedX
              totalRotationRef.current.yaw = rotationAngle * normalizedY
              totalRotationRef.current.roll = rotationAngle * normalizedZ

              setAnimatedPitch(
                wrapAngle(pitch + totalRotationRef.current.pitch),
              )
              setAnimatedYaw(wrapAngle(yaw + totalRotationRef.current.yaw))
              setAnimatedRoll(wrapAngle(roll + totalRotationRef.current.roll))
            }
          }

          if (animParams.pauseDuration > 0 && pauseStartTimeRef.current === 0) {
            const currentCycleCount = Math.floor(targetRotations)
            if (
              currentCycleCount > 0 &&
              currentCycleCount !== cycleCountRef.current
            ) {
              cycleCountRef.current = currentCycleCount
              if (currentCycleCount % animParams.repeatCount === 0) {
                pauseStartTimeRef.current = currentTime
              }
            }
          }
        }

        motionAnimationRef.current = requestAnimationFrame(animate)
      }

      motionAnimationRef.current = requestAnimationFrame(animate)
    } else {
      setAnimatedYaw(yaw)
      setAnimatedPitch(pitch)
      setAnimatedRoll(roll)
      totalRotationRef.current = { pitch: 0, yaw: 0, roll: 0 }
    }

    return () => {
      if (motionAnimationRef.current) {
        cancelAnimationFrame(motionAnimationRef.current)
      }
    }
  }, [mode, speed, yaw, pitch, roll, getAnimationParams, easingFunctions])

  useEffect(() => {
    if (!containerRef.current) return

    const transforms = containerRef.current.querySelectorAll('transform')
    if (transforms.length >= 3) {
      transforms[0].setAttribute(
        'rotation',
        `1 0 0 ${(animatedPitch * Math.PI) / 180}`,
      )
      transforms[1].setAttribute(
        'rotation',
        `0 1 0 ${(animatedYaw * Math.PI) / 180}`,
      )
      transforms[2].setAttribute(
        'rotation',
        `0 0 1 ${(animatedRoll * Math.PI) / 180}`,
      )
    }
  }, [animatedPitch, animatedYaw, animatedRoll])

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
})

ShapeViewer.displayName = 'ShapeViewer'

export default ShapeViewer
