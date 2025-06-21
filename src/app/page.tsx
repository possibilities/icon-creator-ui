import Link from 'next/link'
import { getAllPolyhedronNames } from '@/lib/polyhedra'

export default async function Home() {
  const polyhedra = await getAllPolyhedronNames()

  return (
    <main className='min-h-screen p-8'>
      <div className='container mx-auto'>
        <h1 className='text-4xl font-bold mb-8'>Polyhedra Viewer</h1>
        <p className='text-lg mb-6'>Select a polyhedron to view its data:</p>

        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'>
          {polyhedra.map(name => (
            <Link
              key={name}
              href={`/${name}`}
              className='p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-center'
            >
              <span className='text-sm capitalize'>
                {name.replace(/-/g, ' ')}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
