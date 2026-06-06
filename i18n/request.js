import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'use-intl';
import { defaultLocale, locales } from './locales';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(locales, requested) ? requested : defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: 'Europe/Istanbul'
  };
});
