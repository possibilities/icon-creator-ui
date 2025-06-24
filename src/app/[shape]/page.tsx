import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{
    shape: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ShapeRedirect({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  const queryString = new URLSearchParams(
    Object.entries(resolvedSearchParams).reduce(
      (acc, [key, value]) => {
        if (value) {
          acc[key] = Array.isArray(value) ? value[0] : value
        }
        return acc
      },
      {} as Record<string, string>,
    ),
  ).toString()

  redirect(
    `/${resolvedParams.shape}/scene${queryString ? `?${queryString}` : ''}`,
  )
}
