interface ICSEvent {
  company: string;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  assignedDriver?: string;
  passengers: number;
  description?: string;
  bookingId?: string;
}

export function generateICS(event: ICSEvent): string {
  const now = new Date();
  const timestamp = formatICSDate(now);

  const startDateTime = parseDateTime(event.pickupDate, event.pickupTime);
  const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

  const uid = `${event.bookingId || Math.random().toString(36).substring(7)}@ridepilot.com`;

  const summary = `${event.company} - Pickup`;

  const location = event.pickupLocation;

  let descriptionText = '';
  if (event.description) {
    descriptionText += `${event.description}\\n\\n`;
  }
  descriptionText += `Pickup: ${event.pickupLocation}\\n`;
  descriptionText += `Drop-off: ${event.dropoffLocation}\\n`;
  if (event.assignedDriver) {
    descriptionText += `Driver: ${event.assignedDriver}\\n`;
  }
  descriptionText += `Passengers: ${event.passengers}`;

  const alarm24h = createAlarm(24 * 60);
  const alarm2h = createAlarm(2 * 60);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RidePilot//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:RidePilot Booking',
    'X-WR-TIMEZONE:Europe/Lisbon',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${formatICSDate(startDateTime)}`,
    `DTEND:${formatICSDate(endDateTime)}`,
    `SUMMARY:${escapeICSText(summary)}`,
    `LOCATION:${escapeICSText(location)}`,
    `DESCRIPTION:${escapeICSText(descriptionText)}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    alarm24h,
    alarm2h,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
}

function formatICSDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

function parseDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  return new Date(year, month - 1, day, hours, minutes);
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function createAlarm(minutesBefore: number): string {
  return [
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: Pickup in ${minutesBefore / 60} hours`,
    `TRIGGER:-PT${minutesBefore}M`,
    'END:VALARM'
  ].join('\r\n');
}

export function generateBulkICS(events: ICSEvent[]): string {
  if (events.length === 0) {
    throw new Error('No events provided for bulk calendar export');
  }

  const now = new Date();
  const timestamp = formatICSDate(now);

  const calendarHeader = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RidePilot//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:RidePilot Active Projects',
    'X-WR-TIMEZONE:Europe/Lisbon'
  ];

  const vevents = events.map(event => {
    const startDateTime = parseDateTime(event.pickupDate, event.pickupTime);
    const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

    const uid = `${event.bookingId || Math.random().toString(36).substring(7)}@ridepilot.com`;
    const summary = `${event.company} - Pickup`;
    const location = event.pickupLocation;

    let descriptionText = '';
    if (event.description) {
      descriptionText += `${event.description}\\n\\n`;
    }
    descriptionText += `Pickup: ${event.pickupLocation}\\n`;
    descriptionText += `Drop-off: ${event.dropoffLocation}\\n`;
    if (event.assignedDriver) {
      descriptionText += `Driver: ${event.assignedDriver}\\n`;
    }
    descriptionText += `Passengers: ${event.passengers}`;

    const alarm24h = createAlarm(24 * 60);
    const alarm2h = createAlarm(2 * 60);

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${formatICSDate(startDateTime)}`,
      `DTEND:${formatICSDate(endDateTime)}`,
      `SUMMARY:${escapeICSText(summary)}`,
      `LOCATION:${escapeICSText(location)}`,
      `DESCRIPTION:${escapeICSText(descriptionText)}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      alarm24h,
      alarm2h,
      'END:VEVENT'
    ].join('\r\n');
  });

  const icsContent = [
    ...calendarHeader,
    ...vevents,
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
}

export function downloadICS(icsContent: string, filename: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
