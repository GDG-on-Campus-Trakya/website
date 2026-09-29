import { absoluteUrl, baseUrl, getSiteMeta } from '@/lib/seo';
import { getEventStart } from '@/utils/eventTime';
import { getLocalizedField } from '@/utils/localeUtils';

const HOME_LABEL = { tr: 'Ana Sayfa', en: 'Home' };
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Markdown to one line of plain text, for meta descriptions and JSON-LD. */
export function plainText(markdown, maxLength = 160) {
  const text = String(markdown || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>`~|-]{1,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length)}…`;
}

/** ISO 8601 with the +03:00 offset an event's local start time is stored in. */
export function istanbulIso(date) {
  return new Date(date.getTime() + ISTANBUL_OFFSET_MS)
    .toISOString()
    .replace(/\.\d{3}Z$/, '+03:00');
}

export function organizationRef() {
  return { '@id': `${baseUrl}/#organization` };
}

/** items: [{ name, path }] from the section down; the home page is prepended. */
export function breadcrumbJsonLd(locale, items) {
  const all = [{ name: HOME_LABEL[locale] || HOME_LABEL.tr, path: '' }, ...items];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(locale, item.path)
    }))
  };
}

export function eventJsonLd(event, locale, { description, image } = {}) {
  const start = getEventStart(event);
  if (!start) return null;

  const site = getSiteMeta(locale);
  const location = getLocalizedField(event, 'location', locale);

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: getLocalizedField(event, 'name', locale),
    description: description || undefined,
    startDate: istanbulIso(start),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: location || (locale === 'en' ? 'Trakya University' : 'Trakya Üniversitesi'),
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Edirne',
        addressCountry: 'TR'
      }
    },
    image: image ? [image] : undefined,
    url: absoluteUrl(locale, `/events/${event.docId ?? event.id}`),
    inLanguage: locale,
    organizer: {
      '@type': 'Organization',
      name: site.siteName,
      url: absoluteUrl(locale),
      ...organizationRef()
    }
  };
}
