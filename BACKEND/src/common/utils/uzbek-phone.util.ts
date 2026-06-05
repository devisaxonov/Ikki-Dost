export const UZBEK_PHONE_REGEX = /^\+998\d{9}$/;

export const UZBEK_PHONE_MESSAGE =
  "Telefon raqam O'zbekiston formatida bo'lishi kerak: +998901234567";

export const normalizeUzbekPhone = (value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }

  const compactValue = value.trim();

  if (!compactValue) {
    return compactValue;
  }

  const digitsOnly = compactValue.replace(/\D/g, '');

  if (digitsOnly.length === 9) {
    return `+998${digitsOnly}`;
  }

  if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
    return `+998${digitsOnly.slice(1)}`;
  }

  if (digitsOnly.length === 12 && digitsOnly.startsWith('998')) {
    return `+${digitsOnly}`;
  }

  if (digitsOnly.length === 13 && digitsOnly.startsWith('998')) {
    return `+${digitsOnly}`;
  }

  return compactValue;
};

export const isValidUzbekPhone = (value: string) =>
  UZBEK_PHONE_REGEX.test(normalizeUzbekPhone(value) as string);
