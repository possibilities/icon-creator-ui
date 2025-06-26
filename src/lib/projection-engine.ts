import ClipperLib from 'clipper-lib'
import { gapToScaleFactor } from './polyhedra-client'

export interface ProjectionParams {
  vertices: number[][]
  faces: number[][]
  pitch: number
  yaw: number
  roll: number
  gap: number
  width: number
  height: number
  fov: number
  cameraDistance?: number
}

export interface PolygonData {
  faceIndex: number
  vertices: { x: number; y: number }[]
  front: boolean
}

export interface Vertex2D {
  x: number
  y: number
}

export interface Vertex3D {
  pos: [number, number, number]
  x: number
  y: number
}

function calculateBoundingSphere(vertices: number[][]): {
  center: number[]
  radius: number
} {
  const centroid = vertices.reduce(
    (acc, vertex) => [
      acc[0] + vertex[0] / vertices.length,
      acc[1] + vertex[1] / vertices.length,
      acc[2] + vertex[2] / vertices.length,
    ],
    [0, 0, 0],
  )

  const radius = Math.max(
    ...vertices.map(vertex => {
      const dx = vertex[0] - centroid[0]
      const dy = vertex[1] - centroid[1]
      const dz = vertex[2] - centroid[2]
      return Math.sqrt(dx * dx + dy * dy + dz * dz)
    }),
  )

  return { center: centroid, radius }
}

function projectVertex(
  v: number[],
  pitch: number,
  yaw: number,
  roll: number,
  cameraDistance: number,
  fieldOfView: number,
  width: number,
  height: number,
): Vertex3D {
  const radPitch = (pitch * Math.PI) / 180
  const radYaw = (yaw * Math.PI) / 180
  const radRoll = (roll * Math.PI) / 180

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
    x: (ndcX + 1) * (width / 2),
    y: (1 - ndcY) * (height / 2),
    pos: [x3, y3, z3],
  }
}

function insetFace(
  face: number[],
  gap: number,
  vertices: number[][],
): number[][] {
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
}

export function calculateProjections(params: ProjectionParams): PolygonData[] {
  const { vertices, faces, pitch, yaw, roll, gap, width, height, fov } = params

  const { radius } = calculateBoundingSphere(vertices)
  const fieldOfView = (fov * Math.PI) / 180
  const cameraDistance =
    params.cameraDistance ?? radius / Math.sin(fieldOfView / 2) + radius

  const facesInfo = faces.map((face, i) => {
    const insetVerts = insetFace(face, gap, vertices)

    const verts3d = insetVerts.map(
      v =>
        projectVertex(
          v,
          pitch,
          yaw,
          roll,
          cameraDistance,
          fieldOfView,
          width,
          height,
        ).pos,
    )
    const verts2d = insetVerts.map(v => {
      const { x, y } = projectVertex(
        v,
        pitch,
        yaw,
        roll,
        cameraDistance,
        fieldOfView,
        width,
        height,
      )
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
    const toCamera = [-centroid[0], -centroid[1], cameraDistance - centroid[2]]
    const dot =
      normal[0] * toCamera[0] +
      normal[1] * toCamera[1] +
      normal[2] * toCamera[2]

    return { faceIndex: i, vertices: verts2d, front: dot > 0 }
  })

  return facesInfo
}
