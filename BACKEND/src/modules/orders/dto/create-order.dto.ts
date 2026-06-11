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
  @IsString({ message: "Taom ID qator bo'lishi kerak" })
  @IsNotEmpty({ message: "Taom ID kiritilishi shart" })
  foodId!: string;

  @Type(() => Number)
  @IsInt({ message: "Miqdor butun son bo'lishi kerak" })
  @Min(1, { message: "Miqdor kamida 1 bo'lishi kerak" })
  @Max(99, { message: "Miqdor eng ko'pi bilan 99 bo'lishi mumkin" })
  quantity!: number;
}

class OrderLocationDto {
  @Type(() => Number)
  @IsNumber({}, { message: "Kenglik (lat) son bo'lishi kerak" })
  @Min(-90, { message: "Kenglik -90 dan kichik bo'lmasligi kerak" })
  @Max(90, { message: "Kenglik 90 dan katta bo'lmasligi kerak" })
  lat!: number;

  @Type(() => Number)
  @IsNumber({}, { message: "Uzunlik (lng) son bo'lishi kerak" })
  @Min(-180, { message: "Uzunlik -180 dan kichik bo'lmasligi kerak" })
  @Max(180, { message: "Uzunlik 180 dan katta bo'lmasligi kerak" })
  lng!: number;
}

class OrderAddressDto {
  @Transform(({ value }) => normalizePlainText(value))
  @IsString({ message: "Ism qator bo'lishi kerak" })
  @IsNotEmpty({ message: "Ism kiritilishi shart" })
  @MinLength(2, { message: "Ism kamida 2 ta belgidan iborat bo'lishi kerak" })
  @MaxLength(50, { message: "Ism eng ko'pi bilan 50 ta belgidan iborat bo'lishi mumkin" })
  @IsSafeText({ message: "Ism maydonida HTML yoki xavfli skript bo'lishi mumkin emas" })
  firstName!: string;

  @Transform(({ value }) => normalizePlainText(value))
  @IsString({ message: "Familiya qator bo'lishi kerak" })
  @IsNotEmpty({ message: "Familiya kiritilishi shart" })
  @MinLength(2, { message: "Familiya kamida 2 ta belgidan iborat bo'lishi kerak" })
  @MaxLength(50, { message: "Familiya eng ko'pi bilan 50 ta belgidan iborat bo'lishi mumkin" })
  @IsSafeText({ message: "Familiya maydonida HTML yoki xavfli skript bo'lishi mumkin emas" })
  lastName!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsEmail({}, { message: "Elektron pochta manzili noto'g'ri formatda" })
  email?: string;

  @Transform(({ value }) => normalizePlainText(value))
  @IsString({ message: "Ko'cha qator bo'lishi kerak" })
  @IsNotEmpty({ message: "Ko'cha kiritilishi shart" })
  @MinLength(5, { message: "Ko'cha kamida 5 ta belgidan iborat bo'lishi kerak" })
  @MaxLength(150, { message: "Ko'cha eng ko'pi bilan 150 ta belgidan iborat bo'lishi mumkin" })
  @IsSafeText({ message: "Ko'cha maydonida HTML yoki xavfli skript bo'lishi mumkin emas" })
  street!: string;

  @Transform(({ value }) => normalizePlainText(value))
  @IsString({ message: "Shahar qator bo'lishi kerak" })
  @IsNotEmpty({ message: "Shahar kiritilishi shart" })
  @MinLength(2, { message: "Shahar kamida 2 ta belgidan iborat bo'lishi kerak" })
  @MaxLength(60, { message: "Shahar eng ko'pi bilan 60 ta belgidan iborat bo'lishi mumkin" })
  @IsSafeText({ message: "Shahar maydonida HTML yoki xavfli skript bo'lishi mumkin emas" })
  city!: string;

  @Transform(({ value }) => normalizePlainText(value))
  @IsOptional()
  @IsString({ message: "Viloyat qator bo'lishi kerak" })
  @MinLength(2, { message: "Viloyat kamida 2 ta belgidan iborat bo'lishi kerak" })
  @MaxLength(60, { message: "Viloyat eng ko'pi bilan 60 ta belgidan iborat bo'lishi mumkin" })
  @IsSafeText({ message: "Viloyat maydonida HTML yoki xavfli skript bo'lishi mumkin emas" })
  state?: string;

  @Transform(({ value }) => normalizePlainText(value))
  @IsOptional()
  @IsString({ message: "Pochta indeksi qator bo'lishi kerak" })
  @MinLength(3, { message: "Pochta indeksi kamida 3 ta belgidan iborat bo'lishi kerak" })
  @MaxLength(20, { message: "Pochta indeksi eng ko'pi bilan 20 ta belgidan iborat bo'lishi mumkin" })
  @IsSafeText({ message: "Pochta indeksi maydonida HTML yoki xavfli skript bo'lishi mumkin emas" })
  zipCode?: string;

  @Transform(({ value }) => normalizePlainText(value))
  @IsOptional()
  @IsString({ message: "Davlat qator bo'lishi kerak" })
  @MinLength(2, { message: "Davlat kamida 2 ta belgidan iborat bo'lishi kerak" })
  @MaxLength(60, { message: "Davlat eng ko'pi bilan 60 ta belgidan iborat bo'lishi mumkin" })
  @IsSafeText({ message: "Davlat maydonida HTML yoki xavfli skript bo'lishi mumkin emas" })
  country?: string;

  @IsString({ message: "Telefon raqam qator bo'lishi kerak" })
  @IsNotEmpty({ message: "Telefon raqam kiritilishi shart" })
  @Transform(({ value }) => normalizeUzbekPhone(value))
  @Matches(UZBEK_PHONE_REGEX, {
    message: UZBEK_PHONE_MESSAGE,
  })
  phone!: string;

  @Transform(({ value }) => normalizePlainText(value))
  @IsOptional()
  @IsString({ message: "Izoh qator bo'lishi kerak" })
  @MaxLength(300, { message: "Izoh eng ko'pi bilan 300 ta belgidan iborat bo'lishi mumkin" })
  @IsSafeText({ message: "Izoh maydonida HTML yoki xavfli skript bo'lishi mumkin emas" })
  note?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => OrderLocationDto)
  location?: OrderLocationDto;
}

export class CreateOrderDto {
  @IsArray({ message: "Taomlar ro'yxati massiv bo'lishi kerak" })
  @ArrayNotEmpty({ message: "Taomlar ro'yxati bo'sh bo'lishi mumkin emas" })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ValidateNested()
  @Type(() => OrderAddressDto)
  address!: OrderAddressDto;
}
