import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @IsNotEmpty()
  @IsString()
  shippingAddressId: string;

  @IsOptional()
  @IsString()
  billingAddressId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;
}
