const CURRENCY_MAP: Record<string, { locale: string; currency: string }> = {
  pen: { locale: "es-PE", currency: "PEN" },
  cop: { locale: "es-CO", currency: "COP" },
  usd: { locale: "en-US", currency: "USD" },
  eur: { locale: "de-DE", currency: "EUR" },
}

export function formatCurrency(amount: number, currencyCode = "pen"): string {
  const config = CURRENCY_MAP[currencyCode] ?? CURRENCY_MAP.pen
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
  }).format(amount)
}
