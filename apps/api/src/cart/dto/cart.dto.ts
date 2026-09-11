import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class AddCartItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsString()
  variantId: string;

  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @IsOptional()
  price?: number;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}

export class LocalCartItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsString()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class MergeCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocalCartItemDto)
  items: LocalCartItemDto[];
}
