/**
 * Generates and triggers a download of an RFC 5545 .ics calendar file.
 * Uses "floating" local time (no Z suffix, no TZID) so the event appears
 * at the correct wall-clock time regardless of the viewer's timezone.
 */
export function generateICS({ title, description, expertName, date, timeSlot }) {
  // date: YYYY-MM-DD, timeSlot: HH:MM
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = timeSlot.split(':').map(Number);

  const pad = (n) => String(n).padStart(2, '0');

  // Build a local (floating) datetime string — no trailing "Z"
  const formatLocalDT = (y, mo, d, h, mi, s = 0) =>
    `${y}${pad(mo)}${pad(d)}T${pad(h)}${pad(mi)}${pad(s)}`;

  const dtStart = formatLocalDT(year, month, day, hour, minute);

  // Build end time with proper day rollover (e.g. 23:00 → next day 00:00)
  let endHour = hour + 1;
  let endDay = day;
  let endMonth = month;
  let endYear = year;

  if (endHour >= 24) {
    endHour = 0;
    // Use Date to correctly handle month/year boundary rollovers too
    const rolled = new Date(year, month - 1, day + 1); // month is 0-indexed in Date
    endYear = rolled.getFullYear();
    endMonth = rolled.getMonth() + 1;
    endDay = rolled.getDate();
  }

  const dtEnd = formatLocalDT(endYear, endMonth, endDay, endHour, minute);

  // Current UTC stamp for DTSTAMP (this one stays UTC per spec)
  const now = new Date();
  const dtstamp =
    now.getUTCFullYear() +
    pad(now.getUTCMonth() + 1) +
    pad(now.getUTCDate()) +
    'T' +
    pad(now.getUTCHours()) +
    pad(now.getUTCMinutes()) +
    pad(now.getUTCSeconds()) +
    'Z';

  const safeDescription = (description || `1-on-1 strategy session with ${expertName} on ExpertConnect.`)
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ExpertConnect//Session Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:expertconnect-${Date.now()}@expertconnect.com`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title || `Consultation with ${expertName}`}`,
    `DESCRIPTION:${safeDescription}`,
    'LOCATION:ExpertConnect Virtual Room',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `session-${(expertName || 'expert').replace(/\s+/g, '_')}-${date}.ics`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
