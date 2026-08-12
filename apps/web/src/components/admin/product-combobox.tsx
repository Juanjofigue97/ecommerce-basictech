"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ProductOption {
  id: string
  name: string
  brand?: string
}

interface ProductComboboxProps {
  products: ProductOption[]
  selectedIds: string[]
  onSelect: (id: string) => void
  placeholder?: string
  className?: string
}

export function ProductCombobox({
  products,
  selectedIds,
  onSelect,
  placeholder = "Buscar producto...",
  className,
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false)

  const triggerLabel =
    selectedIds.length === 0
      ? placeholder
      : `${selectedIds.length} producto${selectedIds.length === 1 ? "" : "s"} seleccionado${selectedIds.length === 1 ? "" : "s"}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal sm:w-[320px]", className)}
        >
          <span className={cn(selectedIds.length === 0 && "text-muted-foreground")}>
            {triggerLabel}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Escribe para buscar..." />
          <CommandList>
            <CommandEmpty>No se encontraron productos.</CommandEmpty>
            <CommandGroup>
              {products.map((product) => {
                const isSelected = selectedIds.includes(product.id)
                return (
                  <CommandItem
                    key={product.id}
                    value={`${product.name} ${product.brand ?? ""}`}
                    onSelect={() => onSelect(product.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{product.name}</span>
                      {product.brand && (
                        <span className="truncate text-xs text-muted-foreground">
                          {product.brand}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
