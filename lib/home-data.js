import 'server-only';
import { getFirestore } from '@/utils/firebaseAdmin';
import { logger } from '@/utils/logger';
import { getEventStart as eventStart } from '@/utils/eventTime';

const EMPTY = { events: [], lastEvent: null, announcements: [], stats: null };

// Aggregation queries read no documents; a failed count hides that figure, not the page.
async function countOf(query) {
  try {
    const snapshot = await query.count().get();
    return snapshot.data().count;
  } catch (error) {
    logger.error('Home count could not be loaded:', error);
    return null;
  }
}

export function toIso(value) {
  if (!value) return null;
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Upcoming events, the most recent past event and the latest announcements for
 * the home page. Returns only the fields the page shows. Never throws: on any
 * failure the home page renders its empty states.
 */
export async function getHomeData() {
  const db = getFirestore();
  if (!db) return EMPTY;

  try {
    const [eventsSnap, announcementsSnap, members, registrations, partners] = await Promise.all([
      db.collection('events').get(),
      db.collection('clubAnnouncements').where('isPublished', '==', true).get(),
      countOf(db.collection('users')),
      countOf(db.collection('registrations')),
      countOf(db.collection('sponsors'))
    ]);

    const now = Date.now();

    const allEvents = eventsSnap.docs
      .map((doc) => {
        const data = doc.data();
        const start = eventStart(data);
        return start
          ? {
              id: doc.id,
              name: data.name || '',
              nameEn: data.nameEn || '',
              location: data.location || '',
              locationEn: data.locationEn || '',
              time: data.time || '',
              start: start.toISOString()
            }
          : null;
      })
      .filter(Boolean);

    const events = allEvents
      .filter((event) => new Date(event.start).getTime() >= now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 5);

    const pastEvents = allEvents
      .filter((event) => new Date(event.start).getTime() < now)
      .sort((a, b) => new Date(b.start) - new Date(a.start));

    // Shown in place of "next event" while nothing is scheduled
    const lastEvent = pastEvents[0] || null;

    const announcements = announcementsSnap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          titleEn: data.titleEn || '',
          createdAt: toIso(data.createdAt)
        };
      })
      .filter((announcement) => announcement.title)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 3);

    // Real counts only: the strip used to show round numbers nobody could check.
    const stats = { members, events: pastEvents.length, registrations, partners };

    return { events, lastEvent, announcements, stats };
  } catch (error) {
    logger.error('Home data could not be loaded:', error);
    return EMPTY;
  }
}
