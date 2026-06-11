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
  @IsString({ message: "Ism qator bo'lishi kerak" })
  @MinLength(2, { message: "Ism kamida 2 ta belgidan iborat bo'lishi kerak" })
  @MaxLength(60, { message: "Ism eng ko'pi bilan 60 ta belgidan iborat bo'lishi mumkin" })
  @IsSafeText({ message: "Ism maydonida HTML yoki xavfli skript bo'lishi mumkin emas" })
  name?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsEmail({}, { message: "Elektron pochta manzili noto'g'ri formatda" })
  email?: string;

  @Transform(({ value }) => normalizeUzbekPhone(value))
  @IsOptional()
  @IsString({ message: "Telefon raqam qator bo'lishi kerak" })
  @Matches(UZBEK_PHONE_REGEX, {
    message: UZBEK_PHONE_MESSAGE,
  })
  phone?: string;

  @IsOptional()
  @IsString({ message: "Joriy parol qator bo'lishi kerak" })
  @MinLength(8, { message: "Joriy parol kamida 8 ta belgidan iborat bo'lishi kerak" })
  @MaxLength(72, { message: "Joriy parol eng ko'pi bilan 72 ta belgidan iborat bo'lishi mumkin" })
  currentPassword?: string;

  @IsOptional()
  @IsString({ message: "Yangi parol qator bo'lishi kerak" })
  @MinLength(10, { message: "Parol kamida 10 ta belgidan iborat bo'lishi kerak" })
  @MaxLength(72, { message: "Parol eng ko'pi bilan 72 ta belgidan iborat bo'lishi mumkin" })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/, {
    message:
      "Yangi parolda kamida 1 ta katta harf, 1 ta raqam va 1 ta maxsus belgi ishtirok etishi kerak",
  })
  newPassword?: string;
}
