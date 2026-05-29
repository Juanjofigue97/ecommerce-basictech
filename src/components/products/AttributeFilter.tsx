"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface AttributeValue {
  id: string
  value: string
}

interface AttributeFilterProps {
  attribute: { id: string; name: string; values: AttributeValue[] }
  selectedValueIds: string[]
  onValuesChange: (valueIds: string[]) => void
  availableValues?: Set<string>
}

export function AttributeFilter({ attribute, selectedValueIds, onValuesChange, availableValues }: AttributeFilterProps) {
  const [isOpen, setIsOpen] = useState(true)

  function toggle(valueId: string) {
    if (selectedValueIds.includes(valueId)) {
      onValuesChange(selectedValueIds.filter((id) => id !== valueId))
    } else {
      onValuesChange([...selectedValueIds, valueId])
    }
  }

  // If availableValues is provided, only show values that are either selected or available
  const visibleValues = availableValues
    ? attribute.values.filter((v) => selectedValueIds.includes(v.id) || availableValues.has(v.value))
    : attribute.values

  if (visibleValues.length === 0) return null

  return (
    <div className="border-b pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-2 font-medium"
      >
        {attribute.name}
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="mt-2 flex flex-wrap gap-2">
          {visibleValues.map((val) => {
            const selected = selectedValueIds.includes(val.id)
            return (
              <button
                key={val.id}
                onClick={() => toggle(val.id)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-all ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary hover:text-primary"
                }`}
              >
                {val.value}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
