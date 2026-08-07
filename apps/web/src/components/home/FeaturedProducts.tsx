"use client"

import { useEffect } from "react"
import { ProductCard } from "@/components/products/ProductCard"
import { useProductsStore } from "@/stores/products-store"
import { Skeleton } from "@/components/ui/skeleton"

export function FeaturedProducts() {
  const { featuredProducts, featuredLoading, fetchFeaturedProducts } = useProductsStore()

  useEffect(() => {
    fetchFeaturedProducts()
  }, [fetchFeaturedProducts])

  // Nothing to show once loaded and there are no featured products — don't
  // get stuck rendering skeletons forever (length === 0 can't tell "still
  // loading" apart from "loaded, legitimately empty").
  if (!featuredLoading && featuredProducts.length === 0) return null

  return (
    <section className="pt-4 pb-12 sm:pt-6 sm:pb-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            : featuredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      </div>
    </section>
  )
}
