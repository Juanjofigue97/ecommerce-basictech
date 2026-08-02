export interface CreateCheckoutParams {
  reference: string
  amountInCents: number
  currency: string
  customerEmail: string
  redirectUrl: string
}

export interface CheckoutResult {
  url: string
  reference: string
}

export type WebhookEventType = "payment.completed" | "payment.failed" | "payment.pending"

export interface PaymentWebhookEvent {
  type: WebhookEventType
  reference: string
  transactionId: string
  amountInCents: number
}

export interface IPaymentService {
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>
  parseWebhookEvent(payload: string, checksum: string): PaymentWebhookEvent | null
}
