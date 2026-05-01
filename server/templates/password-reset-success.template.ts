export interface PasswordResetSuccessEmailData {
  adminName: string;
  email: string;
  resetDate: string;
}

export function getPasswordResetSuccessEmailTemplate(data: PasswordResetSuccessEmailData): string {
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
    .header-icon { width: 80px; height: 80px; background: #fff; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 40px; }
    .header-title { font-size: 28px; font-weight: 700; color: #fff; margin: 0 0 8px; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    .content { padding: 30px 30px; }
    .greeting { font-size: 18px; color: #2C3E50; font-weight: 600; margin-bottom: 15px; }
    .message { font-size: 14px; color: #555; margin-bottom: 15px; line-height: 1.6; }
    .info-box { background: #E8F8F5; border-left: 4px solid #27AE60; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-text { font-size: 13px; color: #145A32; margin: 0; }
    .footer { background: #2C3E50; color: #fff; padding: 20px; text-align: center; margin-top: 20px; }
    .footer-text { font-size: 12px; color: #BDC3C7; margin: 5px 0; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <div class="header-icon">✓</div>
      <h1 class="header-title" style="font-size: 28px; font-weight: 700; color: #fff; margin: 0 0 8px; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">Password Reset Successful</h1>
    </div>
    
    <div class="content">
      <h2 class="greeting">Hello ${data.adminName},</h2>
      
      <p class="message">
        Your password has been successfully changed for your Prayas Yavatmal admin account.
      </p>
      
      <div class="info-box">
        <p class="info-text">
          <strong>Account:</strong> ${data.email}<br>
          <strong>Changed on:</strong> ${data.resetDate}
        </p>
      </div>
      
      <p class="message">
        If you did not make this change, please contact the system administrator immediately.
      </p>
      
      <p class="message" style="margin-top: 20px;">
        Best regards,<br>
        <strong style="color: #27AE60;">Prayas Yavatmal Team</strong>
      </p>
    </div>
    
    <div class="footer">
      <p class="footer-text">info@prayasyavatmal.org | www.prayasyavatmal.org</p>
      <p class="footer-text" style="font-size: 11px; color: #95A5A6; margin-top: 8px;">
        This is a system generated email. Please do not reply.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
