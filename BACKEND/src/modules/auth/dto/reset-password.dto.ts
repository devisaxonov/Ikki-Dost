import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: "Token kiritish majburiy" })
  @IsString()
  token: string;

  @IsNotEmpty({ message: "Parolni kiritish majburiy" })
  @IsString()
  @MinLength(10, { message: "Parol kamida 10 ta belgidan iborat bo'lishi kerak" })
  @MaxLength(72)
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/, {
    message:
      "Parolda kamida 1 ta katta harf, 1 ta raqam va 1 ta maxsus belgi ishtirok etishi kerak",
  })
  newPassword: string;
}
