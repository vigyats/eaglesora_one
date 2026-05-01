import { db } from '../db';
import { eventRegistrations, events, eventTranslations } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { sendEmail } from './email.service';
import { getEventReminderEmailTemplate, getEventThankYouEmailTemplate } from '../templates/event-participant.template';

export async function getEventRegistrations(eventId: number) {
  return await db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.eventId, eventId))
    .orderBy(eventRegistrations.registeredAt);
}

function getEmailFromFormData(formData: any): string {
  // Find email field in form data
  const emailField = Object.entries(formData).find(([key, value]) => 
    key.toLowerCase().includes('email') || 
    (typeof value === 'string' && value.includes('@'))
  );
  return emailField ? String(emailField[1]) : '';
}

function getNameFromFormData(formData: any): string {
  // Find name field in form data
  const nameField = Object.entries(formData).find(([key]) => 
    key.toLowerCase().includes('name')
  );
  return nameField ? String(nameField[1]) : 'Participant';
}

export async function sendEventReminders(eventId: number) {
  const registrations = await getEventRegistrations(eventId);
  
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  
  if (!event) throw new Error('Event not found');
  
  const [translation] = await db
    .select()
    .from(eventTranslations)
    .where(and(
      eq(eventTranslations.eventId, eventId),
      eq(eventTranslations.language, 'en')
    ))
    .limit(1);
  
  const results = await Promise.allSettled(
    registrations.map(async (reg) => {
      const email = getEmailFromFormData(reg.formData);
      if (!email) return;
      
      const emailHtml = getEventReminderEmailTemplate({
        participantName: getNameFromFormData(reg.formData),
        eventTitle: translation?.title || event.slug,
        eventDate: event.startDate ? new Date(event.startDate).toLocaleDateString('en-IN') : 'TBA',
        eventLocation: translation?.location || 'TBA',
        eventTime: event.startDate ? new Date(event.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : undefined,
      });
      
      await sendEmail({
        to: email,
        subject: `Reminder: ${translation?.title || event.slug}`,
        html: emailHtml,
      });
    })
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  return { sent: successful, total: registrations.length };
}

export async function sendEventThankYou(eventId: number) {
  const registrations = await getEventRegistrations(eventId);
  
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  
  if (!event) throw new Error('Event not found');
  
  const [translation] = await db
    .select()
    .from(eventTranslations)
    .where(and(
      eq(eventTranslations.eventId, eventId),
      eq(eventTranslations.language, 'en')
    ))
    .limit(1);
  
  const results = await Promise.allSettled(
    registrations.map(async (reg) => {
      const email = getEmailFromFormData(reg.formData);
      if (!email) return;
      
      const emailHtml = getEventThankYouEmailTemplate({
        participantName: getNameFromFormData(reg.formData),
        eventTitle: translation?.title || event.slug,
      });
      
      await sendEmail({
        to: email,
        subject: `Thank You for Participating - ${translation?.title || event.slug}`,
        html: emailHtml,
      });
    })
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  return { sent: successful, total: registrations.length };
}
