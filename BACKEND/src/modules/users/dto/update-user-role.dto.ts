import { IsIn, IsString } from 'class-validator';

export class UpdateUserRoleDto {
  @IsString()
  @IsIn(['admin', 'customer'], {
    message: "Rol faqat 'admin' yoki 'customer' bo'lishi mumkin",
  })
  role!: string;
}
