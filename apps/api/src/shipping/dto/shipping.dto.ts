import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SelectShippingRateDto {
  @IsNotEmpty()
  @IsString()
  shippingRateId: string;

  @IsOptional()
  shippingAmount?: number;

  @IsOptional()
  fakeShippingAmount?: number;
}
