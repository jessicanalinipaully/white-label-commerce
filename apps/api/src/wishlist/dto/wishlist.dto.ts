import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddWishlistItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;
}

export class MergeWishlistDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  productIds?: string[];
}
