import { defaultLocale, locales } from '@/i18n/locales';

export const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || 'https://gdgoncampustu.com';

export const siteMeta = {
  tr: {
    siteName: 'GDG on Campus Trakya Üniversitesi',
    title: 'GDG on Campus Trakya Üniversitesi | Google Developer Groups',
    description:
      "GDG on Campus Trakya Üniversitesi (gdgoncampustu), Trakya Üniversitesi'nde teknoloji, yazılım geliştirme ve inovasyon topluluğu. Etkinlikler, hackathonlar ve eğitim programları.",
    ogLocale: 'tr_TR'
  },
  en: {
    siteName: 'GDG on Campus Trakya University',
    title: 'GDG on Campus Trakya University | Google Developer Groups',
    description:
      'GDG on Campus Trakya University is a student-led Google Developer Groups on Campus community focused on technology, innovation, workshops, hackathons and collaborative learning.',
    ogLocale: 'en_US'
  }
};

export function getSiteMeta(locale) {
  return siteMeta[locale] || siteMeta[defaultLocale];
}

/**
 * Path of a page for a locale. The default locale has no prefix
 * (`localePrefix: 'as-needed'`), so `/events` stays `/events` and `en` gets `/en/events`.
 */
export function localePath(locale, path = '') {
  const clean = path === '/' ? '' : path;
  if (locale === defaultLocale) return clean || '/';
  return `/${locale}${clean}`;
}

export function absoluteUrl(locale, path = '') {
  return `${baseUrl}${localePath(locale, path)}`;
}

/** hreflang map for one page, including x-default (the default locale). */
export function languageAlternates(path = '') {
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, absoluteUrl(locale, path)])
  );
  languages['x-default'] = absoluteUrl(defaultLocale, path);
  return languages;
}

/**
 * Metadata for one page. `alternates` replaces the parent's wholesale in Next,
 * so every page has to state its own canonical and hreflang set.
 *
 * `title` is the page title without the site name; the root layout template adds it.
 * Pass `absoluteTitle: true` to use it as is (home page).
 */
export function buildMetadata({
  locale,
  path = '',
  title,
  description,
  image,
  type = 'website',
  noindex = false,
  absoluteTitle = false,
  publishedTime,
  modifiedTime
}) {
  const site = getSiteMeta(locale);
  const url = absoluteUrl(locale, path);
  const fullTitle = absoluteTitle ? title : `${title} | GDG on Campus Trakya`;
  // A page that sets `openGraph` drops the file-based /opengraph-image, so name it here.
  const ogImages = image
    ? [{ url: image, alt: title }]
    : [{ url: '/opengraph-image', width: 1200, height: 630, alt: site.siteName }];
  const twitterImages = [image || '/twitter-image'];

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
      languages: languageAlternates(path)
    },
    openGraph: {
      type,
      url,
      siteName: site.siteName,
      locale: site.ogLocale,
      alternateLocale: locales
        .filter((entry) => entry !== locale)
        .map((entry) => getSiteMeta(entry).ogLocale),
      title: fullTitle,
      description,
      images: ogImages,
      ...(type === 'article' && {
        ...(publishedTime && { publishedTime }),
        ...(modifiedTime && { modifiedTime })
      })
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: twitterImages
    },
    ...(noindex && { robots: { index: false, follow: false } })
  };
}
