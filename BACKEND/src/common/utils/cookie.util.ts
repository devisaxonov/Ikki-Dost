export const parseCookies = (cookieHeader?: string) => {
  if (!cookieHeader) {
    return {} as Record<string, string>;
  }

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, cookie) => {
      const separatorIndex = cookie.indexOf('=');

      if (separatorIndex === -1) {
        return acc;
      }

      const key = decodeURIComponent(cookie.slice(0, separatorIndex).trim());
      const value = decodeURIComponent(cookie.slice(separatorIndex + 1).trim());

      if (key) {
        acc[key] = value;
      }

      return acc;
    }, {});
};
