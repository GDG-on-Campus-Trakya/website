export const locales = ['tr', 'en'];
export const defaultLocale = 'tr';

export function isValidLocale(locale) {
  return locales.includes(locale);
}
