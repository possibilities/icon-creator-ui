import { getAllPolyhedronNames, getPolyhedronData } from '@/lib/polyhedra'
import ShapeContainer from '@/components/shape-container'

export const dynamicParams = false

export async function generateStaticParams() {
  const shapes = await getAllPolyhedronNames()

  return shapes.map(shape => ({
    shape: shape,
  }))
}

interface PageProps {
  params: Promise<{
    shape: string
  }>
}

export default async function PolyhedronPage({ params }: PageProps) {
  const resolvedParams = await params
  const data = await getPolyhedronData(resolvedParams.shape)
  const shapes = await getAllPolyhedronNames()

  return (
    <ShapeContainer
      shapes={shapes}
      shapeName={resolvedParams.shape}
      vertices={data!.vertices}
      faces={data!.faces}
    />
  )
}
