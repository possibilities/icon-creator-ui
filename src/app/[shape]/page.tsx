import { getAllPolyhedronNames, getPolyhedronData } from '@/lib/polyhedra'
import ShapeViewer from '@/components/shape-viewer'
import ShapeSidebar from '@/components/shape-sidebar'

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
    <>
      <ShapeSidebar shapes={shapes} />
      <div className='w-full h-screen'>
        <ShapeViewer
          key={resolvedParams.shape}
          shapeName={resolvedParams.shape}
          vertices={data!.vertices}
          faces={data!.faces}
        />
      </div>
    </>
  )
}
