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
    <div className='w-full h-screen flex'>
      <div className='w-1/2 h-full p-4'>
        <h2 className='text-lg font-semibold mb-2 text-center'>
          Spacious View
        </h2>
        <div className='w-full h-[calc(100%-2rem)]'>
          <ShapeViewer
            vertices={data!.vertices}
            faces={data!.faces}
            edges={data!.edges}
            viewType='spacious'
          />
        </div>
      </div>
      <div className='w-1/2 h-full p-4'>
        <h2 className='text-lg font-semibold mb-2 text-center'>Cozy View</h2>
        <div className='w-full h-[calc(100%-2rem)]'>
          <ShapeViewer
            vertices={data!.vertices}
            faces={data!.faces}
            edges={data!.edges}
            viewType='cozy'
          />
        </div>
      </div>
    </div>
  )
}
