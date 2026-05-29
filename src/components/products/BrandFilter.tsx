"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Search } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Brand } from "@/types"

interface BrandFilterProps {
  brands: Brand[]
  selectedBrands: string[]
  onBrandsChange: (brands: string[]) => void
  counts?: Record<string, number>
}

export function BrandFilter({ brands, selectedBrands, onBrandsChange, counts }: BrandFilterProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function toggle(name: string) {
    if (selectedBrands.includes(name)) {
      onBrandsChange(selectedBrands.filter((b) => b !== name))
    } else {
      onBrandsChange([...selectedBrands, name])
    }
  }

  return (
    <div className="border-b pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-2 font-medium"
      >
        Marca
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="mt-2 space-y-3">
          {brands.length > 5 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar marca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
          )}
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {filtered.map((brand) => {
              const selected = selectedBrands.includes(brand.name)
              const count = counts ? (counts[brand.name] ?? 0) : brand.productCount
              const disabled = !selected && counts !== undefined && count === 0

              return (
                <div key={brand.id} className={`flex items-center space-x-2 ${disabled ? "opacity-40" : ""}`}>
                  <Checkbox
                    id={`brand-${brand.id}`}
                    checked={selected}
                    disabled={disabled}
                    onCheckedChange={() => toggle(brand.name)}
                  />
                  <Label
                    htmlFor={`brand-${brand.id}`}
                    className={`flex flex-1 items-center justify-between text-sm font-normal ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span>{brand.name}</span>
                    <span className="text-xs text-muted-foreground">{count}</span>
                  </Label>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
