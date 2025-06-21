import { getAllPolyhedronNames, getPolyhedronData } from '@/lib/polyhedra'

export const dynamicParams = false

export async function generateStaticParams() {
  const models = await getAllPolyhedronNames()

  return models.map(model => ({
    model: model,
  }))
}

interface PageProps {
  params: Promise<{
    model: string
  }>
}

export default async function PolyhedronPage({ params }: PageProps) {
  const resolvedParams = await params
  const data = await getPolyhedronData(resolvedParams.model)

  return (
    <div className='container mx-auto p-8'>
      <h1 className='text-3xl font-bold mb-6 capitalize'>
        {data!.name.replace(/-/g, ' ')}
      </h1>

      <div className='bg-gray-100 dark:bg-gray-800 rounded-lg p-4'>
        <pre className='overflow-auto text-sm'>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  )
}
