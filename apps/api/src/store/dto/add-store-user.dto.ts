import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { StoreUserRole } from '@commerce/types';

export class AddStoreUserDto {
  @IsString()
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @IsOptional()
  @IsEnum(StoreUserRole, { message: 'Invalid store user role' })
  role?: StoreUserRole;
}
