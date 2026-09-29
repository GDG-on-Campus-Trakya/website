// Turkey has been on UTC+3 all year since 2016. Event dates are stored as a local
// date + "HH:MM" string, so read them as Istanbul time whatever zone the runtime is in.
const ISTANBUL_OFFSET = '+03:00';

/** Start of an event as a Date, or null when the date is missing or invalid. */
export function getEventStart(event) {
  const day =
    typeof event?.date === 'string'
      ? event.date.slice(0, 10)
      : event?.date?.toDate?.().toISOString().slice(0, 10);
  if (!day) return null;

  const time = /^\d{1,2}:\d{2}$/.test(event.time || '')
    ? event.time.padStart(5, '0')
    : '00:00';
  const start = new Date(`${day}T${time}:00${ISTANBUL_OFFSET}`);
  return Number.isNaN(start.getTime()) ? null : start;
}
