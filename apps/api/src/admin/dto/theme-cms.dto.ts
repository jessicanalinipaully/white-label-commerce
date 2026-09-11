import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsHexColor,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { HomepageSectionType } from '@commerce/types';

export const ALLOWED_FONTS = ['INTER', 'PLAYFAIR_DISPLAY', 'POPPINS', 'ROBOTO', 'MONTSERRAT'];
export const ALLOWED_BORDER_RADIUS = ['NONE', 'SMALL', 'MEDIUM', 'LARGE', 'PILL'];
export const ALLOWED_BUTTON_STYLES = ['SOLID', 'OUTLINE', 'ROUNDED'];

// Custom validator regex for URLs excluding javascript: scheme
export const SAFE_URL_REGEX = /^(?:https?:\/\/|\/)[^\s]+$/i;

export class UpdateThemeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @IsOptional()
  @IsHexColor()
  accentColor?: string;

  @IsOptional()
  @IsHexColor()
  backgroundColor?: string;

  @IsOptional()
  @IsHexColor()
  textColor?: string;

  @IsOptional()
  @IsString()
  headingFont?: string;

  @IsOptional()
  @IsString()
  bodyFont?: string;

  @IsOptional()
  @IsString()
  fontFamilyHeading?: string;

  @IsOptional()
  @IsString()
  fontFamilyBody?: string;

  @IsOptional()
  @IsString()
  borderRadius?: string;

  @IsOptional()
  @IsString()
  buttonStyle?: string;
}

export class UpdateBrandingDto {
  @IsOptional()
  @Matches(SAFE_URL_REGEX, { message: 'logoUrl must be a valid http(s) or relative URL' })
  logoUrl?: string;

  @IsOptional()
  @Matches(SAFE_URL_REGEX, { message: 'faviconUrl must be a valid http(s) or relative URL' })
  faviconUrl?: string;

  @IsOptional()
  @IsString()
  storeDisplayName?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @Matches(SAFE_URL_REGEX, { message: 'socialPreviewImageUrl must be a valid http(s) or relative URL' })
  socialPreviewImageUrl?: string;
}

export class UpdateHomepageDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;
}

export class CreateHomepageSectionDto {
  @IsEnum(HomepageSectionType)
  type: HomepageSectionType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @Matches(SAFE_URL_REGEX, { message: 'imageUrl must be a valid http(s) or relative URL' })
  imageUrl?: string;

  @IsOptional()
  @IsString()
  buttonText?: string;

  @IsOptional()
  @Matches(SAFE_URL_REGEX, { message: 'buttonUrl must be a valid http(s) or relative URL' })
  buttonUrl?: string;

  @IsOptional()
  @Matches(SAFE_URL_REGEX, { message: 'buttonLink must be a valid http(s) or relative URL' })
  buttonLink?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  config?: any;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateHomepageSectionDto {
  @IsOptional()
  @IsEnum(HomepageSectionType)
  type?: HomepageSectionType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @Matches(SAFE_URL_REGEX, { message: 'imageUrl must be a valid http(s) or relative URL' })
  imageUrl?: string;

  @IsOptional()
  @IsString()
  buttonText?: string;

  @IsOptional()
  @Matches(SAFE_URL_REGEX, { message: 'buttonUrl must be a valid http(s) or relative URL' })
  buttonUrl?: string;

  @IsOptional()
  @Matches(SAFE_URL_REGEX, { message: 'buttonLink must be a valid http(s) or relative URL' })
  buttonLink?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  config?: any;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ReorderHomepageSectionsDto {
  @IsArray()
  @IsString({ each: true })
  sectionIds: string[];
}
