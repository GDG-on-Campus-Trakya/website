import 'server-only';
import { cache } from 'react';
import { getFirestore } from '@/utils/firebaseAdmin';
import { logger } from '@/utils/logger';
import { getEventStart as eventStart } from '@/utils/eventTime';

/**
 * Firestore documents to plain JSON: Timestamps become ISO strings so the result can
 * cross into client components and be embedded in JSON-LD.
 */
export function serialize(value) {
  if (value == null) return value;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, serialize(entry)])
    );
  }
  return value;
}

// Some legacy documents carry their own `id` field, which the client-side code has always
// let win over the Firestore id (registrations reference it). It is kept as is; `docId`
// is always the Firestore document id and is what URLs are built from.
function toRecord(doc) {
  return { id: doc.id, ...serialize(doc.data()), docId: doc.id };
}

async function readCollection(name, label, build) {
  const db = getFirestore();
  if (!db) return [];

  try {
    return await build(db.collection(name));
  } catch (error) {
    logger.error(`${label} could not be loaded:`, error);
    return [];
  }
}

async function readDocument(name, id, label) {
  const db = getFirestore();
  if (!db || !id) return null;

  try {
    const doc = await db.collection(name).doc(id).get();
    return doc.exists ? toRecord(doc) : null;
  } catch (error) {
    logger.error(`${label} could not be loaded:`, error);
    return null;
  }
}

/** Every event with `startsAt` (ISO, Istanbul time) added, oldest first. */
export const getAllEvents = cache(async () =>
  readCollection('events', 'Events', async (collection) => {
    const snapshot = await collection.get();
    return snapshot.docs
      .map((doc) => {
        const record = toRecord(doc);
        const start = eventStart(record);
        return start ? { ...record, startsAt: start.toISOString() } : null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  })
);

export const getEventById = cache(async (id) => {
  const event = await readDocument('events', id, 'Event');
  if (!event) return null;

  const start = eventStart(event);
  return start ? { ...event, startsAt: start.toISOString() } : null;
});

/**
 * Visible photos shared on /social for an event (`posts.eventId` is the event's own id). An
 * aggregation query, so it reads no documents. 0 when it cannot be counted.
 */
export const getEventPhotoCount = cache(async (eventId) => {
  const db = getFirestore();
  if (!db || !eventId) return 0;

  try {
    const snapshot = await db
      .collection('posts')
      .where('eventId', '==', eventId)
      .where('isHidden', '==', false)
      .count()
      .get();
    return snapshot.data().count;
  } catch (error) {
    logger.error('Event photo count could not be loaded:', error);
    return 0;
  }
});

export const getSponsors = cache(async () =>
  readCollection('sponsors', 'Sponsors', async (collection) => {
    const snapshot = await collection.get();
    return snapshot.docs.map(toRecord);
  })
);

/** Published announcements, newest first. */
export const getPublishedAnnouncements = cache(async () =>
  readCollection('clubAnnouncements', 'Announcements', async (collection) => {
    const snapshot = await collection.where('isPublished', '==', true).get();
    return snapshot.docs
      .map(toRecord)
      .filter((announcement) => announcement.title)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  })
);

/** Null for missing and for unpublished announcements. */
export const getAnnouncementById = cache(async (id) => {
  const announcement = await readDocument(
    'clubAnnouncements',
    id,
    'Announcement'
  );
  return announcement?.isPublished ? announcement : null;
});

export const getProjects = cache(async () =>
  readCollection('projects', 'Projects', async (collection) => {
    const snapshot = await collection.get();
    return snapshot.docs
      .map(toRecord)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  })
);

export const getProjectById = cache(async (id) =>
  readDocument('projects', id, 'Project')
);
