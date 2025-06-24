import { Suspense } from 'react'
import {
  getAllPolyhedronNames,
  getPolyhedronData,
} from '@/lib/polyhedra-server'
import ShapeContainer from '@/components/shape-container'

export const dynamicParams = false

export async function generateStaticParams() {
  const shapes = await getAllPolyhedronNames()
  const modes = ['scene', 'motion']

  return shapes.flatMap(shape =>
    modes.map(mode => ({
      shape: shape,
      mode: mode,
    })),
  )
}

interface PageProps {
  params: Promise<{
    shape: string
    mode: string
  }>
}

export default async function PolyhedronPage({ params }: PageProps) {
  const resolvedParams = await params
  const data = await getPolyhedronData(resolvedParams.shape)
  const shapes = await getAllPolyhedronNames()

  return (
    <Suspense fallback={null}>
      <ShapeContainer
        shapes={shapes}
        shapeName={resolvedParams.shape}
        mode={resolvedParams.mode}
        vertices={data!.vertices}
        faces={data!.faces}
      />
    </Suspense>
  )
}
