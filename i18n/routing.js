import { defineRouting } from 'next-intl/routing';
import { defaultLocale, locales } from './locales';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  alternateLinks: true,
  localeDetection: true,
  localeCookie: {
    name: 'gdg-locale',
    sameSite: 'lax'
  }
});
