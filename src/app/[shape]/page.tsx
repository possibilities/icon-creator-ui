import { getAllPolyhedronNames, getPolyhedronData } from '@/lib/polyhedra'
import ShapeViewer from '@/components/shape-viewer'

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

  return (
    <ShapeViewer
      vertices={data!.vertices}
      faces={data!.faces}
      edges={data!.edges}
    />
  )
}
