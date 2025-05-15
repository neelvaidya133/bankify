import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/utils/card-utils'
import ProductGrid from './components/ProductGrid'

export default async function CatalogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Product Catalog</h1>
      </div>

      <ProductGrid products={products || []} />
    </div>
  )
} 