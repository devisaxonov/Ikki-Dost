import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { IsSafeText } from '../../../common/decorators/is-safe-text.decorator';
import { normalizePlainText } from '../../../common/utils/input-sanitizer.util';
import {
  normalizeUzbekPhone,
  UZBEK_PHONE_MESSAGE,
  UZBEK_PHONE_REGEX,
} from '../../../common/utils/uzbek-phone.util';

class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  foodId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}

class OrderLocationDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;
}

class OrderAddressDto {
  @Transform(({ value }) => normalizePlainText(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @IsSafeText()
  firstName!: string;

  @Transform(({ value }) => normalizePlainText(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @IsSafeText()
  lastName!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsEmail()
  email?: string;

  @Transform(({ value }) => normalizePlainText(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(150)
  @IsSafeText()
  street!: string;

  @Transform(({ value }) => normalizePlainText(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(60)
  @IsSafeText()
  city!: string;

  @Transform(({ value }) => normalizePlainText(value))
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @IsSafeText()
  state?: string;

  @Transform(({ value }) => normalizePlainText(value))
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @IsSafeText()
  zipCode?: string;

  @Transform(({ value }) => normalizePlainText(value))
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @IsSafeText()
  country?: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => normalizeUzbekPhone(value))
  @Matches(UZBEK_PHONE_REGEX, {
    message: UZBEK_PHONE_MESSAGE,
  })
  phone!: string;

  @Transform(({ value }) => normalizePlainText(value))
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @IsSafeText()
  note?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => OrderLocationDto)
  location?: OrderLocationDto;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ValidateNested()
  @Type(() => OrderAddressDto)
  address!: OrderAddressDto;
}
