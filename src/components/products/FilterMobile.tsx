"use client"

import { useState } from "react"
import { Eraser, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet"

import { ScrollArea } from "@/components/ui/scroll-area"
import { FilterSidebar } from "./FilterSidebar"
import { FilterState } from "@/types"

interface FacetCounts {
  categories: Record<string, number>
  brands: Record<string, number>
}

interface FilterMobileProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  activeFilterCount: number
  productCount: number
  facetCounts: FacetCounts
  onClearFilters: () => void
}

export function FilterMobile({
  filters,
  onFiltersChange,
  activeFilterCount,
  productCount,
  facetCounts,
  onClearFilters,
}: FilterMobileProps) {
  const [open, setOpen] = useState(false)

  function handleClear() {
    onClearFilters()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="flex flex-col gap-0 p-0 w-[300px] sm:w-[360px]">
        {/* Header */}
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-base">Filtros</SheetTitle>
        </SheetHeader>

        {/* Scrollable filters */}
        <ScrollArea className="flex-1">
          <div className="px-4 py-4">
            <FilterSidebar
              filters={filters}
              onFiltersChange={onFiltersChange}
              facetCounts={facetCounts}
              hideClearButton
            />
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t px-4 py-4 flex flex-col gap-3">
          <SheetClose asChild>
            <Button className="w-full">
              Ver {productCount} producto{productCount !== 1 ? "s" : ""}
            </Button>
          </SheetClose>
          {activeFilterCount > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <Eraser className="h-4 w-4" />
              Limpiar filtros
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
