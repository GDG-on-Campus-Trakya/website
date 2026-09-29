import { locales } from '@/i18n/locales';
import {
  getAllEvents,
  getProjects,
  getPublishedAnnouncements
} from '@/lib/content-data';
import { getAllTests } from '@/lib/personality-test';
import { absoluteUrl, languageAlternates } from '@/lib/seo';

// Public pages only. Login, profile, tickets, admin and the live game screens are
// noindex and stay out of the sitemap. Google ignores changeFrequency and priority,
// and lastModified is only sent when a document really has one.
const STATIC_ROUTES = [
  '',
  '/about',
  '/events',
  '/announcements',
  '/projects',
  '/faq',
  '/social',
  '/personality-test',
  '/typing-test',
  '/privacy',
  '/terms',
  '/cookie-policy'
];

function entriesFor(path, lastModified) {
  return locales.map((locale) => ({
    url: absoluteUrl(locale, path),
    ...(lastModified && { lastModified: new Date(lastModified) }),
    alternates: { languages: languageAlternates(path) }
  }));
}

export default async function sitemap() {
  const [events, announcements, projects, tests] = await Promise.all([
    getAllEvents(),
    getPublishedAnnouncements(),
    getProjects(),
    getAllTests().catch(() => [])
  ]);

  return [
    ...STATIC_ROUTES.flatMap((route) => entriesFor(route)),
    ...events.flatMap((event) =>
      entriesFor(`/events/${event.docId}`, event.updatedAt)
    ),
    ...announcements.flatMap((announcement) =>
      entriesFor(
        `/announcements/${announcement.docId}`,
        announcement.updatedAt || announcement.createdAt
      )
    ),
    ...projects.flatMap((project) =>
      entriesFor(
        `/projects/${project.docId}`,
        project.updatedAt || project.createdAt
      )
    ),
    ...tests.flatMap((test) => entriesFor(`/personality-test/${test.slug}`))
  ];
}
