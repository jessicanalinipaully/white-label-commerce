import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import {
  PaymentProviderInterface,
  PaymentProviderOrderResult,
  VerifyPaymentParams,
} from './payment-provider.interface';
import { MockPaymentProvider } from './mock.provider';

@Injectable()
export class RazorpayProvider implements PaymentProviderInterface {
  readonly name = 'RAZORPAY';

  constructor(
    private readonly configService: ConfigService,
    private readonly mockProvider: MockPaymentProvider,
  ) {}

  private isConfigured(): boolean {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    return Boolean(keyId && secret && !keyId.includes('placeholder'));
  }

  async createPaymentOrder(params: {
    orderId: string;
    amount: number;
    currency: string;
  }): Promise<PaymentProviderOrderResult> {
    if (!this.isConfigured()) {
      return this.mockProvider.createPaymentOrder(params);
    }

    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID')!;
    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET')!;

    // Dynamic import / REST API call to Razorpay order endpoint
    const authHeader = `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`;
    const amountInPaise = Math.round(params.amount * 100);

    try {
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: params.currency || 'INR',
          receipt: params.orderId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Razorpay API error: ${res.statusText}`);
      }

      const data = await res.json();
      return {
        providerOrderId: data.id,
        amount: params.amount,
        currency: params.currency,
        keyId,
        provider: 'RAZORPAY',
      };
    } catch {
      // Graceful fallback to mock provider for local test environment
      return this.mockProvider.createPaymentOrder(params);
    }
  }

  verifyPaymentSignature(params: VerifyPaymentParams): boolean {
    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (!secret || secret.includes('placeholder')) {
      return this.mockProvider.verifyPaymentSignature(params);
    }

    const expected = createHmac('sha256', secret)
      .update(`${params.providerOrderId}|${params.providerPaymentId}`)
      .digest('hex');

    return expected === params.signature;
  }

  verifyWebhookSignature(rawBody: string | Buffer, signature: string, secret?: string): boolean {
    const webhookSecret = secret || this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!webhookSecret || webhookSecret.includes('placeholder')) {
      return this.mockProvider.verifyWebhookSignature(rawBody, signature, webhookSecret || '');
    }

    const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
    const expected = createHmac('sha256', webhookSecret)
      .update(bodyStr)
      .digest('hex');

    return expected === signature;
  }
}
