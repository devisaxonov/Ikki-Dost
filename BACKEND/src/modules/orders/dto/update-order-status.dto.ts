import { IsIn, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn([
    'Pending',
    'Confirmed',
    'Preparing',
    'Out for delivery',
    'Delivered',
    'Cancelled',
  ])
  status!: string;
}
