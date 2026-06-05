export const UZBEK_PHONE_MESSAGE =
  "Telefon raqamni O'zbekiston formatida kiriting: +998 90 123 45 67";

const getDigits = (value) => String(value ?? '').replace(/\D/g, '');

export const normalizeUzbekPhone = (value) => {
  const digits = getDigits(value);

  if (!digits) {
    return '';
  }

  if (digits.length === 9) {
    return `+998${digits}`;
  }

  if (digits.length === 10 && digits.startsWith('0')) {
    return `+998${digits.slice(1)}`;
  }

  if (digits.length === 12 && digits.startsWith('998')) {
    return `+${digits}`;
  }

  return value?.trim?.() ?? '';
};

export const isValidUzbekPhone = (value) =>
  /^\+998\d{9}$/.test(normalizeUzbekPhone(value));

export const formatUzbekPhoneInput = (value) => {
  const digits = getDigits(value);

  if (!digits) {
    return '';
  }

  let nationalDigits = digits;

  if (nationalDigits.startsWith('998')) {
    nationalDigits = nationalDigits.slice(3);
  } else if (nationalDigits.startsWith('0')) {
    nationalDigits = nationalDigits.slice(1);
  }

  nationalDigits = nationalDigits.slice(0, 9);

  const parts = [];

  if (nationalDigits.slice(0, 2)) {
    parts.push(nationalDigits.slice(0, 2));
  }

  if (nationalDigits.slice(2, 5)) {
    parts.push(nationalDigits.slice(2, 5));
  }

  if (nationalDigits.slice(5, 7)) {
    parts.push(nationalDigits.slice(5, 7));
  }

  if (nationalDigits.slice(7, 9)) {
    parts.push(nationalDigits.slice(7, 9));
  }

  return `+998${parts.length ? ` ${parts.join(' ')}` : ''}`;
};
