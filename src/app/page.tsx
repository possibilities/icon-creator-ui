import { redirect } from 'next/navigation'
import { getAllPolyhedronNames } from '@/lib/polyhedra-server'

export default async function Home() {
  const polyhedra = await getAllPolyhedronNames()

  redirect(`/${polyhedra[0]}/scene`)
}
