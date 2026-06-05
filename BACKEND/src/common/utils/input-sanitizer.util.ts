const HTML_TAG_REGEX = /<[^>]+>/;
const SCRIPT_PROTOCOL_REGEX = /(javascript:|data:text\/html)/i;
const EVENT_HANDLER_REGEX = /\bon[a-z]+\s*=/i;

export const normalizePlainText = (value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\u0000-\u001F\u007F]/g, '');
};

export const containsUnsafeHtml = (value: string) =>
  HTML_TAG_REGEX.test(value) ||
  SCRIPT_PROTOCOL_REGEX.test(value) ||
  EVENT_HANDLER_REGEX.test(value);

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
