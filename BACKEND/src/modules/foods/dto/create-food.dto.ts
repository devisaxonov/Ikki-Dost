import { Transform, Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";
import { IsSafeText } from "../../../common/decorators/is-safe-text.decorator";
import { normalizePlainText } from "../../../common/utils/input-sanitizer.util";

export class CreateFoodDto {
  @Transform(({ value }) => normalizePlainText(value))
  @IsString()
  @IsNotEmpty()
  @IsSafeText()
  name!: string;

  @Transform(({ value }) => normalizePlainText(value))
  @IsString()
  @IsNotEmpty()
  @IsSafeText()
  description!: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price!: number;

  @Transform(({ value }) => normalizePlainText(value))
  @IsString()
  @IsNotEmpty()
  @IsSafeText()
  category!: string;
}
