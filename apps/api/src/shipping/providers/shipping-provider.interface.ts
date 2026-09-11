export interface ShippingRateOption {
  id: string;
  name: string;
  provider: string;
  amount: number;
  currency: string;
  estimatedDaysMin?: number | null;
  estimatedDaysMax?: number | null;
}

export interface ShippingProviderInterface {
  name: string;
  getRates(storeId: string): Promise<ShippingRateOption[]>;
}
