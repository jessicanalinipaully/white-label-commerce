import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty({ message: 'Store name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Store slug is required' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsString()
  @IsNotEmpty({ message: 'Primary domain is required' })
  primaryDomain: string;
}
