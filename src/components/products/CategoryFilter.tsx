"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Category } from "@/types"

interface CategoryFilterProps {
  categories: Category[]
  selectedCategories: string[]
  onCategoriesChange: (categories: string[]) => void
}

export function CategoryFilter({ categories, selectedCategories, onCategoriesChange }: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(true)

  function toggle(slug: string) {
    if (selectedCategories.includes(slug)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== slug))
    } else {
      onCategoriesChange([...selectedCategories, slug])
    }
  }

  return (
    <div className="border-b pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-2 font-medium"
      >
        Categoría
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${cat.id}`}
                checked={selectedCategories.includes(cat.slug)}
                onCheckedChange={() => toggle(cat.slug)}
              />
              <Label
                htmlFor={`cat-${cat.id}`}
                className="flex flex-1 cursor-pointer items-center justify-between text-sm font-normal"
              >
                <span>{cat.name}</span>
                <span className="text-xs text-muted-foreground">{cat.productCount}</span>
              </Label>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
