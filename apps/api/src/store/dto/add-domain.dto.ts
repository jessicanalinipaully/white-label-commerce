import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddDomainDto {
  @IsString()
  @IsNotEmpty({ message: 'Domain is required' })
  domain: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
