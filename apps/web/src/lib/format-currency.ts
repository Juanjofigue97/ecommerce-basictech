const CURRENCY_MAP: Record<string, { locale: string; currency: string; fractionDigits: number }> = {
  pen: { locale: "es-PE", currency: "PEN", fractionDigits: 2 },
  cop: { locale: "es-CO", currency: "COP", fractionDigits: 0 },
  usd: { locale: "en-US", currency: "USD", fractionDigits: 2 },
  eur: { locale: "de-DE", currency: "EUR", fractionDigits: 2 },
}

export function formatCurrency(amount: number, currencyCode = "pen"): string {
  const config = CURRENCY_MAP[currencyCode] ?? CURRENCY_MAP.pen
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
    minimumFractionDigits: config.fractionDigits,
    maximumFractionDigits: config.fractionDigits,
  }).format(amount)
}
