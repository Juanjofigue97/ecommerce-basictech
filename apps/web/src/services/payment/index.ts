import { WompiPaymentService } from "./wompi.service"

export const paymentService = new WompiPaymentService()

export type {
  IPaymentService,
  CreateCheckoutParams,
  CheckoutResult,
  PaymentWebhookEvent,
} from "./types"
