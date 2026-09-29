import 'server-only';
import { getFirestore } from '@/utils/firebaseAdmin';
import { logger } from '@/utils/logger';

// Turkey has been on UTC+3 all year since 2016. Event dates are stored as local
// date + "HH:MM" strings, so read them as Istanbul time whatever the server zone is.
const ISTANBUL_OFFSET = '+03:00';

const EMPTY = { events: [], lastEvent: null, announcements: [] };

function toIso(value) {
  if (!value) return null;
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function eventStart(event) {
  const day =
    typeof event.date === 'string' ? event.date.slice(0, 10) : toIso(event.date)?.slice(0, 10);
  if (!day) return null;
  const time = /^\d{1,2}:\d{2}$/.test(event.time || '') ? event.time.padStart(5, '0') : '00:00';
  const start = new Date(`${day}T${time}:00${ISTANBUL_OFFSET}`);
  return Number.isNaN(start.getTime()) ? null : start;
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
    const [eventsSnap, announcementsSnap] = await Promise.all([
      db.collection('events').get(),
      db.collection('clubAnnouncements').where('isPublished', '==', true).get()
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

    // Shown in place of "next event" while nothing is scheduled
    const lastEvent =
      allEvents
        .filter((event) => new Date(event.start).getTime() < now)
        .sort((a, b) => new Date(b.start) - new Date(a.start))[0] || null;

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

    return { events, lastEvent, announcements };
  } catch (error) {
    logger.error('Home data could not be loaded:', error);
    return EMPTY;
  }
}
