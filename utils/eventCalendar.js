// Calendar helpers for event pages. Dates are read in Istanbul time, where the events happen,
// whatever zone the server or the visitor's browser is in.

const TIME_ZONE = "Europe/Istanbul";

/** { year, month (1-12), day } of a date in Istanbul. */
export function istanbulParts(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(date));
  const value = (type) => Number(parts.find((part) => part.type === type).value);
  return { year: value("year"), month: value("month"), day: value("day") };
}

/**
 * The academic term a date falls in. The club has two: autumn (July to January, so the stand
 * week and other summer events count towards the term they prepare for) and spring (February
 * to June). Terms sort newest first by `order`.
 */
export function academicTerm(date) {
  const { year, month } = istanbulParts(date);
  if (month >= 7) return { key: `${year}-fall`, season: "fall", start: year, order: year * 10 + 3 };
  if (month === 1) return { key: `${year - 1}-fall`, season: "fall", start: year - 1, order: (year - 1) * 10 + 3 };
  return { key: `${year - 1}-spring`, season: "spring", start: year - 1, order: year * 10 + 1 };
}

export function termLabel(term, locale) {
  const span = `${term.start}–${String(term.start + 1).slice(2)}`;
  if (locale === "en") return `${term.season === "fall" ? "Autumn" : "Spring"} term ${span}`;
  return `${span} ${term.season === "fall" ? "güz" : "bahar"} dönemi`;
}

/** Whole calendar days from `now` to `date` in Istanbul (0 = today, 1 = tomorrow, -1 = yesterday). */
export function daysUntil(date, now = new Date()) {
  const a = istanbulParts(now);
  const b = istanbulParts(date);
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86400000);
}

/** "Bugün", "Yarın", "3 gün sonra" for an upcoming date; null for anything further than 60 days. */
export function relativeDay(date, locale, now = new Date()) {
  const days = daysUntil(date, now);
  if (days < 0 || days > 60) return null;
  if (locale === "en") {
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `In ${days} days`;
  }
  if (days === 0) return "Bugün";
  if (days === 1) return "Yarın";
  return `${days} gün sonra`;
}

/** The term label split for a large/small setting: { big: "2025–26", small: "güz dönemi" }. */
export function termLabelParts(term, locale) {
  const span = `${term.start}–${String(term.start + 1).slice(2)}`;
  if (locale === "en") {
    return { big: span, small: term.season === "fall" ? "Autumn term" : "Spring term" };
  }
  return { big: span, small: term.season === "fall" ? "güz dönemi" : "bahar dönemi" };
}
