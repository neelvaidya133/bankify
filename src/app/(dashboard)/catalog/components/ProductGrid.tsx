'use client'

import { useState } from 'react'
import { formatCurrency } from '@/utils/card-utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import PaymentForm from '@/components/credit-cards/PaymentForm'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
}

interface ProductGridProps {
  products: Product[]
}

export default function ProductGrid({ products }: ProductGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="relative h-48 w-full">
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-gray-600 mt-2">{product.description}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
                <Button onClick={() => setSelectedProduct(product)}>
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Image
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  width={80}
                  height={80}
                  className="rounded"
                />
                <div>
                  <h3 className="font-semibold">{selectedProduct.name}</h3>
                  <p className="text-sm text-gray-600">{selectedProduct.description}</p>
                  <p className="text-lg font-bold mt-2">
                    {formatCurrency(selectedProduct.price)}
                  </p>
                </div>
              </div>

              <PaymentForm
                productId={selectedProduct.id}
                amount={selectedProduct.price}
                onSuccess={() => setSelectedProduct(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
} 