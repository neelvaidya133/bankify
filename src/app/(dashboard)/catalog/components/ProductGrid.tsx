"use client";

import { useState } from "react";
import { formatCurrency } from "@/utils/card-utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PaymentForm from "@/components/credit-cards/PaymentForm";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
}

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow overflow-hidden flex flex-col"
          >
            <div className="relative h-48 sm:h-56 w-full">
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={false}
              />
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <div className="mb-2">
                <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
                  {product.category}
                </span>
              </div>
              <h3 className="text-lg font-semibold line-clamp-1">
                {product.name}
              </h3>
              <p className="text-gray-600 mt-2 text-sm line-clamp-2 flex-grow">
                {product.description}
              </p>
              <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <span className="text-xl font-bold">
                  {formatCurrency(product.price)}
                </span>
                <Button
                  onClick={() => setSelectedProduct(product)}
                  className="w-full sm:w-auto"
                >
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={!!selectedProduct}
        onOpenChange={() => setSelectedProduct(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative h-32 w-32 sm:h-40 sm:w-40">
                  <Image
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover rounded"
                    sizes="(max-width: 640px) 128px, 160px"
                  />
                </div>
                <div className="flex-grow">
                  <div className="mb-2">
                    <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
                      {selectedProduct.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedProduct.description}
                  </p>
                  <p className="text-xl font-bold mt-2">
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
  );
}
