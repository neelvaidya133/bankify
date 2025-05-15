import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProductGrid from './components/ProductGrid'

export default async function CatalogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Catalog</h1>
      <ProductGrid products={products || []} />
    </div>
  )
} 