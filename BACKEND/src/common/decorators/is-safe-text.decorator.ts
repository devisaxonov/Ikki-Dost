import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { containsUnsafeHtml } from '../utils/input-sanitizer.util';

export function IsSafeText(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSafeText',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === null || value === undefined || value === '') {
            return true;
          }

          if (typeof value !== 'string') {
            return false;
          }

          return !containsUnsafeHtml(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} maydonida HTML yoki xavfli skript bo'lishi mumkin emas`;
        },
      },
    });
  };
}
