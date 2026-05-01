export interface EventReminderEmailData {
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventTime?: string;
}

export interface EventThankYouEmailData {
  participantName: string;
  eventTitle: string;
}

export function getEventReminderEmailTemplate(data: EventReminderEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2C3E50; background: #F4F6F7; }
    .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #F26522 0%, #E85A1A 100%); padding: 35px 20px 30px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header-title { font-size: 28px; font-weight: 700; color: #fff; margin: 0 0 8px; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    .content { padding: 30px; }
    .greeting { font-size: 18px; color: #2C3E50; font-weight: 600; margin-bottom: 15px; }
    .message { font-size: 14px; color: #555; margin-bottom: 15px; line-height: 1.6; }
    .event-box { background: #FFF3E0; border-left: 4px solid #F26522; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .event-detail { font-size: 14px; color: #2C3E50; margin: 8px 0; }
    .footer { background: #2C3E50; color: #fff; padding: 20px; text-align: center; margin-top: 20px; }
    .footer-text { font-size: 12px; color: #BDC3C7; margin: 5px 0; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <h1 class="header-title">Event Reminder</h1>
    </div>
    <div class="content">
      <h2 class="greeting">Hello ${data.participantName},</h2>
      <p class="message">This is a friendly reminder about your upcoming event registration:</p>
      <div class="event-box">
        <p class="event-detail"><strong>Event:</strong> ${data.eventTitle}</p>
        <p class="event-detail"><strong>Date:</strong> ${data.eventDate}</p>
        ${data.eventTime ? `<p class="event-detail"><strong>Time:</strong> ${data.eventTime}</p>` : ''}
        <p class="event-detail"><strong>Location:</strong> ${data.eventLocation}</p>
      </div>
      <p class="message">We look forward to seeing you there!</p>
      <p class="message" style="margin-top: 20px;">Best regards,<br><strong style="color: #F26522;">Prayas Yavatmal Team</strong></p>
    </div>
    <div class="footer">
      <p class="footer-text">info@prayasyavatmal.org | www.prayasyavatmal.org</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getEventThankYouEmailTemplate(data: EventThankYouEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2C3E50; background: #F4F6F7; }
    .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #27AE60 0%, #229954 100%); padding: 35px 20px 30px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header-title { font-size: 28px; font-weight: 700; color: #fff; margin: 0 0 8px; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    .content { padding: 30px; }
    .greeting { font-size: 18px; color: #2C3E50; font-weight: 600; margin-bottom: 15px; }
    .message { font-size: 14px; color: #555; margin-bottom: 15px; line-height: 1.6; }
    .footer { background: #2C3E50; color: #fff; padding: 20px; text-align: center; margin-top: 20px; }
    .footer-text { font-size: 12px; color: #BDC3C7; margin: 5px 0; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <h1 class="header-title">Thank You for Participating!</h1>
    </div>
    <div class="content">
      <h2 class="greeting">Dear ${data.participantName},</h2>
      <p class="message">Thank you for participating in <strong>${data.eventTitle}</strong>. Your presence made the event a success!</p>
      <p class="message">We hope you found the event valuable and look forward to seeing you at future events.</p>
      <p class="message" style="margin-top: 20px;">With gratitude,<br><strong style="color: #27AE60;">Prayas Yavatmal Team</strong></p>
    </div>
    <div class="footer">
      <p class="footer-text">info@prayasyavatmal.org | www.prayasyavatmal.org</p>
    </div>
  </div>
</body>
</html>
  `;
}
