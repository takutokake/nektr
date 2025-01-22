import { Timestamp } from 'firebase/firestore';

interface CalendarEvent {
  title: string;
  description: string;
  startTime: Timestamp;
  location: string;
  attendees: string[];  // email addresses
}

export const generateICSContent = (event: CalendarEvent): string => {
  console.log('Generating ICS content for event:', {
    title: event.title,
    attendees: event.attendees,
    timestamp: new Date().toISOString()
  });

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDate = formatDate(event.startTime);
  // Set duration to 1 hour by default
  const endDate = formatDate(new Timestamp(event.startTime.seconds + 3600, 0));

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nectr//Calendar Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    `LOCATION:${event.location}`,
    ...event.attendees.map(attendee => `ATTENDEE;RSVP=TRUE:mailto:${attendee}`),
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  console.log('Generated ICS content successfully');
  return icsContent;
};

export const createCalendarInviteLink = (event: CalendarEvent): string => {
  console.log('Creating calendar invite link for:', {
    title: event.title,
    attendees: event.attendees,
    timestamp: new Date().toISOString()
  });

  const icsContent = generateICSContent(event);
  const icsData = encodeURIComponent(icsContent);
  const subject = encodeURIComponent(event.title);
  const body = encodeURIComponent(event.description);
  
  // Create a mailto link with the ICS file as a data URI
  const mailtoLink = `mailto:${event.attendees.join(',')}?subject=${subject}&body=${body}&content-type=text/calendar;method=REQUEST;charset=UTF-8&content=${icsData}`;
  
  console.log('Created mailto link successfully');
  return mailtoLink;
};

export const sendCalendarInvite = (event: CalendarEvent): void => {
  console.group('Calendar Invite Flow');
  console.log('1. Starting calendar invite send:', {
    title: event.title,
    attendees: event.attendees,
    timestamp: new Date().toISOString()
  });

  try {
    const mailtoLink = createCalendarInviteLink(event);
    console.log('2. Opening email client with calendar invite');
    window.location.href = mailtoLink;
    console.log('3. Email client opened successfully');
  } catch (error) {
    console.error('Error sending calendar invite:', error);
  }
  
  console.groupEnd();
};
