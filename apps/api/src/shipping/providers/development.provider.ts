import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ShippingProviderInterface, ShippingRateOption } from './shipping-provider.interface';

@Injectable()
export class DevelopmentShippingProvider implements ShippingProviderInterface {
  readonly name = 'DEVELOPMENT_SHIPPING';

  constructor(private readonly prisma: PrismaService) {}

  async getRates(storeId: string): Promise<ShippingRateOption[]> {
    const rates = await this.prisma.shippingRate.findMany({
      where: { storeId, isActive: true },
      orderBy: { amount: 'asc' },
    });

    return rates.map((r) => ({
      id: r.id,
      name: r.name,
      provider: r.provider,
      amount: Number(r.amount),
      currency: r.currency,
      estimatedDaysMin: r.estimatedDaysMin,
      estimatedDaysMax: r.estimatedDaysMax,
    }));
  }
}
