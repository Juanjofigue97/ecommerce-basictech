"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  onBlur?: () => void
  id?: string
  placeholder?: string
  className?: string
  disabled?: boolean
}

function formatCOP(n: number): string {
  if (!n) return ""
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n)
}

export function CurrencyInput({
  value,
  onChange,
  onBlur,
  id,
  placeholder = "$ 0",
  className,
  disabled,
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "")
    onChange(digits === "" ? 0 : parseInt(digits, 10))
  }

  function handleFocus() {
    setFocused(true)
  }

  function handleBlur() {
    setFocused(false)
    onBlur?.()
  }

  const displayValue = focused
    ? value > 0 ? String(value) : ""
    : value > 0 ? formatCOP(value) : ""

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    />
  )
}
