import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { IsSafeText } from '../../../common/decorators/is-safe-text.decorator';
import { normalizePlainText } from '../../../common/utils/input-sanitizer.util';
import {
  normalizeUzbekPhone,
  UZBEK_PHONE_MESSAGE,
  UZBEK_PHONE_REGEX,
} from '../../../common/utils/uzbek-phone.util';

export class RegisterDto {
  @Transform(({ value }) =>
    normalizePlainText(value),
  )
  @IsString({ message: "Ism qator bo'lishi kerak" })
  @IsNotEmpty({ message: "Ism kiritilishi shart" })
  @MinLength(2, { message: "Ism kamida 2 ta belgidan iborat bo'lishi kerak" })
  @MaxLength(60, { message: "Ism eng ko'pi bilan 60 ta belgidan iborat bo'lishi mumkin" })
  @IsSafeText({ message: "Ism maydonida HTML yoki xavfli skript bo'lishi mumkin emas" })
  name!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: "Elektron pochta manzili noto'g'ri formatda" })
  email!: string;

  @Transform(({ value }) => normalizeUzbekPhone(value))
  @IsString({ message: "Telefon raqam qator bo'lishi kerak" })
  @Matches(UZBEK_PHONE_REGEX, {
    message: UZBEK_PHONE_MESSAGE,
  })
  phone!: string;

  @IsString({ message: "Parol qator bo'lishi kerak" })
  @MinLength(10, { message: "Parol kamida 10 ta belgidan iborat bo'lishi kerak" })
  @MaxLength(72, { message: "Parol eng ko'pi bilan 72 ta belgidan iborat bo'lishi mumkin" })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/, {
    message:
      "Parolda kamida 1 ta katta harf, 1 ta raqam va 1 ta maxsus belgi ishtirok etishi kerak",
  })
  password!: string;
}
