import crypto from "crypto"
import type {
  IPaymentService,
  CreateCheckoutParams,
  CheckoutResult,
  PaymentWebhookEvent,
} from "./types"

const WOMPI_CHECKOUT_URL = "https://checkout.wompi.co/p/"

const STATUS_MAP: Record<string, PaymentWebhookEvent["type"]> = {
  APPROVED: "payment.completed",
  DECLINED: "payment.failed",
  ERROR: "payment.failed",
  VOIDED: "payment.failed",
  PENDING: "payment.pending",
}

export class WompiPaymentService implements IPaymentService {
  private readonly publicKey = process.env.WOMPI_PUBLIC_KEY!
  private readonly integritySecret = process.env.WOMPI_INTEGRITY_SECRET!
  private readonly eventsSecret = process.env.WOMPI_EVENTS_SECRET!

  private generateIntegritySignature(
    reference: string,
    amountInCents: number,
    currency: string
  ): string {
    const data = `${reference}${amountInCents}${currency}${this.integritySecret}`
    return crypto.createHash("sha256").update(data).digest("hex")
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const { reference, amountInCents, currency, customerEmail, redirectUrl } = params

    const signature = this.generateIntegritySignature(reference, amountInCents, currency)

    const searchParams = new URLSearchParams({
      "public-key": this.publicKey,
      currency,
      "amount-in-cents": amountInCents.toString(),
      reference,
      "signature:integrity": signature,
      "redirect-url": redirectUrl,
      "customer-data:email": customerEmail,
    })

    return {
      url: `${WOMPI_CHECKOUT_URL}?${searchParams.toString()}`,
      reference,
    }
  }

  parseWebhookEvent(payload: string, checksum: string): PaymentWebhookEvent | null {
    // Wompi checksum: SHA256(payload_string + events_secret)
    const expected = crypto
      .createHash("sha256")
      .update(payload + this.eventsSecret)
      .digest("hex")

    if (expected !== checksum) return null

    const event = JSON.parse(payload)
    const transaction = event.data?.transaction

    if (!transaction) return null

    return {
      type: STATUS_MAP[transaction.status] ?? "payment.pending",
      reference: transaction.reference,
      transactionId: transaction.id,
      amountInCents: transaction.amount_in_cents,
    }
  }
}
