import { redirect } from "next/navigation"

interface RetailerPageProps {
  params: Promise<{ retailer: string }>
}

export default async function RetailerPage({ params }: RetailerPageProps) {
  const { retailer } = await params
  // Redirigir automáticamente al dashboard del retailer
  redirect(`/${retailer}/dashboard`)
}
