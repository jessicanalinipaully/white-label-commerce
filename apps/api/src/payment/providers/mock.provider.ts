import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import {
  PaymentProviderInterface,
  PaymentProviderOrderResult,
  VerifyPaymentParams,
} from './payment-provider.interface';

@Injectable()
export class MockPaymentProvider implements PaymentProviderInterface {
  readonly name = 'MOCK_PAYMENT';
  private readonly secret = 'mock_secret_key_12345';

  async createPaymentOrder(params: {
    orderId: string;
    amount: number;
    currency: string;
  }): Promise<PaymentProviderOrderResult> {
    const providerOrderId = `rzp_order_mock_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    return {
      providerOrderId,
      amount: params.amount,
      currency: params.currency,
      keyId: 'rzp_test_mock_key_id',
      provider: 'RAZORPAY',
    };
  }

  verifyPaymentSignature(params: VerifyPaymentParams): boolean {
    if (!params.signature || params.signature === 'invalid_signature') {
      return false;
    }
    // Expected HMAC-SHA256 signature algorithm
    const expected = createHmac('sha256', this.secret)
      .update(`${params.providerOrderId}|${params.providerPaymentId}`)
      .digest('hex');

    // Accept signature match OR test signature token
    return (
      params.signature === expected ||
      params.signature.startsWith('valid_sig_') ||
      params.signature === 'test_valid_signature'
    );
  }

  verifyWebhookSignature(rawBody: string | Buffer, signature: string, secret: string): boolean {
    if (!signature || signature === 'invalid_webhook_sig') {
      return false;
    }
    const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
    const expected = createHmac('sha256', secret || this.secret)
      .update(bodyStr)
      .digest('hex');

    return signature === expected || signature.startsWith('valid_webhook_sig_') || signature === 'test_valid_webhook';
  }
}
