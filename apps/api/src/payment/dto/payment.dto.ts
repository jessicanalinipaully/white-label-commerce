import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @IsNotEmpty()
  @IsString()
  razorpay_order_id: string;

  @IsNotEmpty()
  @IsString()
  razorpay_payment_id: string;

  @IsNotEmpty()
  @IsString()
  razorpay_signature: string;
}

export class CreatePaymentOrderDto {
  // Amount is calculated server-side from Order model total.
  // Optional notes/metadata.
  @IsOptional()
  @IsString()
  notes?: string;
}
