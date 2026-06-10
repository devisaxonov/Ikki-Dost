import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: "Yaroqli email manzilini kiriting" })
  @IsNotEmpty({ message: "Email manzilini kiritish majburiy" })
  email: string;
}
