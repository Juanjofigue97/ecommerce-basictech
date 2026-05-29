"use client"

import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrandFilter } from "./BrandFilter"
import { PriceFilter } from "./PriceFilter"
import { CategoryFilter } from "./CategoryFilter"
import { AttributeFilter } from "./AttributeFilter"
import { FilterState } from "@/types"
import { useProductsStore } from "@/stores/products-store"

interface AttributeValue { id: string; value: string }
interface CategoryAttribute { id: string; name: string; slug: string; values: AttributeValue[] }

interface FacetCounts {
  categories: Record<string, number>
  brands: Record<string, number>
}

interface FilterSidebarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  facetCounts?: FacetCounts
  hideClearButton?: boolean
}

export function FilterSidebar({ filters, onFiltersChange, facetCounts, hideClearButton }: FilterSidebarProps) {
  const { categories, brands, products } = useProductsStore()

  // Derive which attribute values are actually present in the filtered products
  const availableAttrValues = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    for (const p of products) {
      for (const v of p.variants ?? []) {
        for (const val of v.values ?? []) {
          if (!map[val.attrName]) map[val.attrName] = new Set()
          map[val.attrName].add(val.value)
        }
      }
    }
    return map
  }, [products])
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([])

  useEffect(() => {
    if (filters.categories.length !== 1) {
      setCategoryAttributes([])
      return
    }
    const cat = categories.find((c) => c.slug === filters.categories[0])
    if (!cat) return
    fetch(`/api/categories/${cat.id}`)
      .then((r) => r.json())
      .then((data) => setCategoryAttributes(data.attributes ?? []))
  }, [filters.categories, categories])

  const hasActiveFilters =
    filters.brands.length > 0 ||
    filters.categories.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 5_000_000 ||
    Object.values(filters.attributeValues).some((v) => v.length > 0)

  function clearFilters() {
    onFiltersChange({
      brands: [],
      categories: [],
      priceRange: [0, 5_000_000],
      sortBy: filters.sortBy,
      attributeValues: {},
    })
  }

  function setAttributeValues(attrId: string, valueIds: string[]) {
    onFiltersChange({
      ...filters,
      attributeValues: { ...filters.attributeValues, [attrId]: valueIds },
    })
  }

  return (
    <div className="space-y-4">
      {!hideClearButton && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Filtros</h2>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-auto p-0 text-sm text-primary hover:text-primary/80"
            >
              Limpiar
              <X className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      <CategoryFilter
        categories={categories}
        selectedCategories={filters.categories}
        counts={facetCounts?.categories}
        onCategoriesChange={(cats) =>
          onFiltersChange({ ...filters, categories: cats, attributeValues: {} })
        }
      />

      {categoryAttributes.map((attr) => (
        <AttributeFilter
          key={attr.id}
          attribute={attr}
          selectedValueIds={filters.attributeValues[attr.id] ?? []}
          onValuesChange={(valueIds) => setAttributeValues(attr.id, valueIds)}
          availableValues={availableAttrValues[attr.name]}
        />
      ))}

      <BrandFilter
        brands={brands}
        selectedBrands={filters.brands}
        counts={facetCounts?.brands}
        onBrandsChange={(b) => onFiltersChange({ ...filters, brands: b })}
      />

      <PriceFilter
        priceRange={filters.priceRange}
        onPriceChange={(priceRange) => onFiltersChange({ ...filters, priceRange })}
      />
    </div>
  )
}
