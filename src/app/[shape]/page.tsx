import { getAllPolyhedronNames, getPolyhedronData } from '@/lib/polyhedra'
import ShapePageClient from '@/components/shape-page-client'

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
    <ShapePageClient
      shapeName={resolvedParams.shape}
      vertices={data!.vertices}
      faces={data!.faces}
      shapes={shapes}
    />
  )
}
