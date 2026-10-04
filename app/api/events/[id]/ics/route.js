import { NextResponse } from "next/server";
import { getEventById } from "@/lib/content-data";
import { absoluteUrl } from "@/lib/seo";
import { plainText } from "@/lib/structured-data";
import { getEventStart } from "@/utils/eventTime";
import { getLocalizedField } from "@/utils/localeUtils";

// Events store only a start time; the calendar entry blocks two hours from it.
const DURATION_MS = 2 * 60 * 60 * 1000;

const utcStamp = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const escapeText = (text) =>
  String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

// RFC 5545 lines are folded at 75 octets; continuation lines start with a space.
function fold(line) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out = [];
  let current = "";
  for (const char of line) {
    const next = current + char;
    if (new TextEncoder().encode(next).length > (out.length ? 74 : 75)) {
      out.push(current);
      current = char;
    } else {
      current = next;
    }
  }
  out.push(current);
  return out.join("\r\n ");
}

/** An .ics file for one event, for Apple Calendar, Outlook and other calendar apps. */
export async function GET(request, { params }) {
  const { id } = await params;
  const locale = new URL(request.url).searchParams.get("locale") === "en" ? "en" : "tr";
  const event = await getEventById(id);
  const start = event && getEventStart(event);
  if (!start) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const name = getLocalizedField(event, "name", locale);
  const location = getLocalizedField(event, "location", locale);
  const url = absoluteUrl(locale, `/events/${id}`);
  const description = [plainText(getLocalizedField(event, "description", locale), 400), url]
    .filter(Boolean)
    .join("\n\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GDG on Campus Trakya//Events//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${id}@gdgoncampustu`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(start)}`,
    `DTEND:${utcStamp(new Date(start.getTime() + DURATION_MS))}`,
    `SUMMARY:${escapeText(name)}`,
    location && `LOCATION:${escapeText(`${location}, Edirne`)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return new NextResponse(lines.map(fold).join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="gdg-${id}.ics"`,
      "Cache-Control": "public, max-age=600",
    },
  });
}
