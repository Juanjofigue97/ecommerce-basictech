"use client"

import { Suspense, useEffect, useState, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { FilterSidebar } from "@/components/products/FilterSidebar"
import { FilterMobile } from "@/components/products/FilterMobile"
import { ProductGrid } from "@/components/products/ProductGrid"
import { SortSelect } from "@/components/products/SortSelect"
import { Skeleton } from "@/components/ui/skeleton"
import { useProductsStore } from "@/stores/products-store"
import { FilterState } from "@/types"


function ProductsContent() {
  const searchParams = useSearchParams()
  const { products, loading, filters, setFilters, resetFilters, fetchProducts, fetchCategories, fetchBrands } = useProductsStore()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const initialFilters: Partial<FilterState> = {}
    if (category) initialFilters.categories = [category]
    if (search) initialFilters.search = search

    if (Object.keys(initialFilters).length > 0) {
      setFilters(initialFilters)
    }

    fetchCategories()
    fetchBrands()
  }, [searchParams, setFilters, fetchCategories, fetchBrands])

  useEffect(() => {
    fetchProducts()
  }, [filters, fetchProducts])

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
  }, [setFilters])

  function clearFilters() {
    resetFilters()
  }

  const activeFilterCount =
    filters.brands.length +
    filters.categories.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 5_000_000 ? 1 : 0) +
    Object.values(filters.attributeValues).reduce((s, ids) => s + ids.length, 0)

  // Derive available facets from the currently loaded (filtered) products
  const facetCounts = useMemo(() => {
    const categories: Record<string, number> = {}
    const brands: Record<string, number> = {}
    for (const p of products) {
      categories[p.category] = (categories[p.category] ?? 0) + 1
      brands[p.brand] = (brands[p.brand] ?? 0) + 1
    }
    return { categories, brands }
  }, [products])

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Productos</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Todos los Productos</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Cargando..." : `${products.length} productos encontrados`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <FilterMobile
            filters={filters}
            onFiltersChange={handleFiltersChange}
            activeFilterCount={activeFilterCount}
            productCount={products.length}
            facetCounts={facetCounts}
            onClearFilters={clearFilters}
          />
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground lg:hidden">
              Limpiar
            </Button>
          )}
          <SortSelect
            value={filters.sortBy}
            onChange={(sortBy) =>
              setFilters({ sortBy: sortBy as FilterState["sortBy"] })
            }
          />
        </div>
      </div>

      <div className="flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
            <FilterSidebar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              facetCounts={facetCounts}
            />
          </div>
        </aside>

        <div className="flex-1">
          <ProductGrid
            products={products}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}

function ProductsPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Skeleton className="mb-6 h-6 w-48" />
      <div className="mb-6 flex justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
      </div>
      <div className="flex gap-8">
        <aside className="hidden w-64 lg:block">
          <Skeleton className="h-96" />
        </aside>
        <div className="flex-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsContent />
    </Suspense>
  )
}
