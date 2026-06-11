import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: "Elektron pochta manzili noto'g'ri formatda" })
  email!: string;

  @IsString({ message: "Parol qator bo'lishi kerak" })
  @MinLength(8, { message: "Parol kamida 8 ta belgidan iborat bo'lishi kerak" })
  @MaxLength(72, { message: "Parol eng ko'pi bilan 72 ta belgidan iborat bo'lishi mumkin" })
  password!: string;
}
