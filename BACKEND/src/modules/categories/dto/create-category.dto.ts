import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { IsSafeText } from '../../../common/decorators/is-safe-text.decorator';
import { normalizePlainText } from '../../../common/utils/input-sanitizer.util';

export class CreateCategoryDto {
  @Transform(({ value }) => normalizePlainText(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(40)
  @IsSafeText()
  name!: string;
}
