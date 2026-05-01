import { sendEmail } from './email.service';
import { getLogoBase64 } from '../utils/logo.util';

export interface UpdateNotification {
  type: 'project' | 'event';
  action: 'created' | 'updated';
  title: string;
  updatedBy: string;
  changes?: string;
}

export async function sendUpdateNotification(data: UpdateNotification) {
  const subject = `${data.type === 'project' ? '📁 Project' : '📅 Event'} ${data.action === 'created' ? 'Created' : 'Updated'}: ${data.title}`;
  
  const logoBase64 = getLogoBase64();
  const actionColor = data.action === 'created' ? '#27AE60' : '#3498DB';
  const actionIcon = data.action === 'created' ? '✓' : '↻';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2C3E50; background: #F4F6F7; }
    .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #F26522 0%, #E85A1A 100%); padding: 30px 20px; text-align: center; border-bottom: 4px solid #27AE60; }
    .logo { width: 80px; height: 80px; margin: 0 auto 12px; display: block; object-fit: contain; }
    .header-title { font-size: 24px; font-weight: 700; color: #fff; margin: 5px 0 3px; letter-spacing: 0.5px; }
    .header-subtitle { font-size: 12px; color: #fff; opacity: 0.95; }
    .content { padding: 30px; }
    .badge { display: inline-block; padding: 8px 16px; background: ${actionColor}; color: white; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; }
    .notification-title { font-size: 22px; color: #2C3E50; font-weight: 700; margin: 20px 0 15px; }
    .info-card { background: #F9FAFB; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #F26522; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E5E7E9; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; color: #7B8A8B; font-size: 13px; }
    .info-value { color: #2C3E50; font-size: 13px; font-weight: 500; }
    .footer { background: #2C3E50; color: #fff; padding: 20px; text-align: center; margin-top: 20px; }
    .footer-text { font-size: 11px; color: #BDC3C7; margin: 5px 0; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      ${logoBase64 ? `<img src="${logoBase64}" alt="Prayas Yavatmal Logo" class="logo" />` : '<div style="width: 80px; height: 80px; background: #fff; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #F26522;">PY</div>'}
      <h1 class="header-title">Prayas Yavatmal</h1>
      <p class="header-subtitle">Admin Notification</p>
    </div>
    
    <div class="content">
      <span class="badge">${actionIcon} ${data.action.toUpperCase()}</span>
      <h2 class="notification-title">${data.type === 'project' ? '📁 Project' : '📅 Event'}: ${data.title}</h2>
      
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">Type:</span>
          <span class="info-value">${data.type === 'project' ? 'Project' : 'Event'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Action:</span>
          <span class="info-value" style="color: ${actionColor}; font-weight: 700;">${data.action === 'created' ? 'New content created' : 'Content updated'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Updated By:</span>
          <span class="info-value">${data.updatedBy}</span>
        </div>
        ${data.changes ? `
        <div class="info-row">
          <span class="info-label">Changes:</span>
          <span class="info-value">${data.changes}</span>
        </div>
        ` : ''}
      </div>
      
      <p style="font-size: 14px; color: #555; margin-top: 20px;">
        Please review the changes in the admin panel.
      </p>
    </div>
    
    <div class="footer">
      <p class="footer-text">Prayas Yavatmal Admin System</p>
      <p class="footer-text" style="font-size: 10px; color: #95A5A6; margin-top: 8px;">
        This is an automated notification.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  await sendEmail({
    to: process.env.EMAIL_USER!,
    subject,
    html,
  });
}
