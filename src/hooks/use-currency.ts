"use client"

import { useEffect } from "react"
import { useAdminStore } from "@/stores/admin-store"
import { formatCurrency } from "@/lib/format-currency"

export function useCurrency() {
  const settings = useAdminStore((s) => s.settings)
  const fetchSettings = useAdminStore((s) => s.fetchSettings)

  useEffect(() => {
    if (!settings) fetchSettings()
  }, [settings, fetchSettings])

  const currency = settings?.currency ?? "cop"

  return (amount: number) => formatCurrency(amount, currency)
}
