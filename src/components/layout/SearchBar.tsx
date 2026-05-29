"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useCurrency } from "@/hooks/use-currency"
import type { Product } from "@/types"

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter()
  const formatPrice = useCurrency()
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    fetch(`/api/products?search=${encodeURIComponent(debouncedQuery)}&limit=6`)
      .then((r) => r.json())
      .then((data) => {
        setSuggestions(data.products ?? [])
        setOpen((data.products ?? []).length > 0)
      })
      .catch(() => setSuggestions([]))
  }, [debouncedQuery])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setOpen(false)
    router.push(`/products?search=${encodeURIComponent(query.trim())}`)
  }

  const handleSelect = (product: Product) => {
    setQuery("")
    setOpen(false)
    router.push(`/products/${product.slug}`)
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <form onSubmit={handleSubmit}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar productos..."
          className="w-full pl-10 pr-4"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
        />
      </form>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg overflow-hidden">
          {suggestions.map((product) => (
            <button
              key={product.id}
              type="button"
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
              onMouseDown={() => handleSelect(product)}
            >
              {product.images?.[0] && (
                <img
                  src={product.images[0]}
                  alt=""
                  className="h-9 w-9 rounded object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
