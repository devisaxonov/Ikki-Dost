import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsSafeText } from '../../../common/decorators/is-safe-text.decorator';
import { normalizePlainText } from '../../../common/utils/input-sanitizer.util';
import {
  normalizeUzbekPhone,
  UZBEK_PHONE_MESSAGE,
  UZBEK_PHONE_REGEX,
} from '../../../common/utils/uzbek-phone.util';

export class UpdateProfileDto {
  @Transform(({ value }) =>
    normalizePlainText(value),
  )
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @IsSafeText()
  name?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsEmail()
  email?: string;

  @Transform(({ value }) => normalizeUzbekPhone(value))
  @IsOptional()
  @IsString()
  @Matches(UZBEK_PHONE_REGEX, {
    message: UZBEK_PHONE_MESSAGE,
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: "Parol kamida 10 ta belgidan iborat bo'lishi kerak" })
  @MaxLength(72)
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/, {
    message:
      "Yangi parolda kamida 1 ta katta harf, 1 ta raqam va 1 ta maxsus belgi ishtirok etishi kerak",
  })
  newPassword?: string;
}
