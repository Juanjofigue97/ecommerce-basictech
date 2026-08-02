"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { useCurrency } from "@/hooks/use-currency"

interface PriceFilterProps {
  priceRange: [number, number]
  onPriceChange: (range: [number, number]) => void
  minPrice?: number
  maxPrice?: number
}

export function PriceFilter({
  priceRange,
  onPriceChange,
  minPrice = 0,
  maxPrice = 5_000_000,
}: PriceFilterProps) {
  const [isOpen, setIsOpen] = useState(true)
  const formatPrice = useCurrency()

  const handleSliderChange = (values: number[]) => {
    onPriceChange([values[0], values[1]])
  }

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    if (!isNaN(value) && value >= minPrice && value <= priceRange[1]) {
      onPriceChange([value, priceRange[1]])
    }
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    if (!isNaN(value) && value <= maxPrice && value >= priceRange[0]) {
      onPriceChange([priceRange[0], value])
    }
  }

  return (
    <div className="border-b pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-2 font-medium"
      >
        Precio
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <Slider
            value={[priceRange[0], priceRange[1]]}
            onValueChange={handleSliderChange}
            min={minPrice}
            max={maxPrice}
            step={10_000}
            className="w-full"
          />

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Min</label>
              <Input
                type="number"
                value={priceRange[0]}
                onChange={handleMinChange}
                className="h-9 text-sm"
                min={minPrice}
                max={priceRange[1]}
                step={10_000}
              />
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{formatPrice(priceRange[0])}</p>
            </div>
            <span className="mt-4 text-muted-foreground">-</span>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Max</label>
              <Input
                type="number"
                value={priceRange[1]}
                onChange={handleMaxChange}
                className="h-9 text-sm"
                min={priceRange[0]}
                max={maxPrice}
                step={10_000}
              />
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{formatPrice(priceRange[1])}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
