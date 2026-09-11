import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateInventoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'Quantity must be non-negative' })
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'Reserved quantity must be non-negative' })
  reservedQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'Low stock threshold must be non-negative' })
  lowStockThreshold?: number;
}

export class InventoryAdjustDto {
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Amount must be at least 1' })
  amount: number;
}
