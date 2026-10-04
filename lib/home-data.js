import 'server-only';
import { getFirestore } from '@/utils/firebaseAdmin';
import { logger } from '@/utils/logger';
import { getAllEvents, getPublishedAnnouncements } from '@/lib/content-data';
import { getLocalizedField } from '@/utils/localeUtils';

// Aggregation queries read no documents; a failed count hides that figure, not the page.
async function countOf(db, name) {
  if (!db) return null;
  try {
    const snapshot = await db.collection(name).count().get();
    return snapshot.data().count;
  } catch (error) {
    logger.error('Home count could not be loaded:', error);
    return null;
  }
}

/**
 * Everything the home page shows, all real: upcoming and past events (newest first) with
 * their posters, what kinds of events happen (counted from the events themselves), the latest
 * announcements and the community counts. Never throws: a part that fails comes back empty
 * and the page leaves that block out.
 */
export async function getHomeData(locale) {
  const db = getFirestore();
  const [events, announcements, members, registrations] = await Promise.all([
    getAllEvents(),
    getPublishedAnnouncements(),
    countOf(db, 'users'),
    countOf(db, 'registrations'),
  ]);
  const now = Date.now();

  const upcoming = events.filter((event) => new Date(event.startsAt).getTime() >= now);
  const past = events.filter((event) => new Date(event.startsAt).getTime() < now).reverse();

  const kinds = new Map();
  past.forEach((event) => {
    if (!event.category) return;
    const entry = kinds.get(event.category) || {
      key: event.category,
      label: getLocalizedField(event, 'category', locale, { translateFallback: true, labelType: 'eventCategory' }),
      count: 0,
      examples: [],
    };
    entry.count += 1;
    const name = getLocalizedField(event, 'name', locale);
    if (entry.examples.length < 3 && !entry.examples.includes(name)) entry.examples.push(name);
    kinds.set(event.category, entry);
  });

  return {
    upcoming,
    past,
    posters: past.filter((event) => event.imageUrl).slice(0, 12),
    kinds: [...kinds.values()].sort((a, b) => b.count - a.count),
    announcements: announcements.slice(0, 3).map(({ id, title, titleEn, createdAt }) => ({
      id,
      title,
      titleEn: titleEn || '',
      createdAt: createdAt || null,
    })),
    // Real counts only: the strip used to show round numbers nobody could check.
    stats: { members, events: past.length, registrations },
  };
}
