export interface PaymentProviderOrderResult {
  providerOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  provider: string;
}

export interface VerifyPaymentParams {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

export interface PaymentProviderInterface {
  name: string;
  createPaymentOrder(params: {
    orderId: string;
    amount: number;
    currency: string;
  }): Promise<PaymentProviderOrderResult>;

  verifyPaymentSignature(params: VerifyPaymentParams): boolean;
  verifyWebhookSignature(rawBody: string | Buffer, signature: string, secret: string): boolean;
}
