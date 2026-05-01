export interface AdminCredentialsEmailData {
  adminName: string;
  username: string;
  email: string;
  temporaryPassword: string;
  resetLink: string;
  role: string;
}

export function getAdminCredentialsEmailTemplate(data: AdminCredentialsEmailData): string {
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
    .header { background: linear-gradient(135deg, #F26522 0%, #E85A1A 100%); padding: 35px 20px 30px; text-align: center; border-bottom: 4px solid #27AE60; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header-title { font-size: 32px; font-weight: 700; color: #fff; margin: 0 0 8px; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    .header-subtitle { font-size: 13px; color: #fff; opacity: 0.95; font-weight: 500; letter-spacing: 0.5px; }
    .content { padding: 30px 30px; }
    .greeting { font-size: 18px; color: #2C3E50; font-weight: 600; margin-bottom: 15px; }
    .message { font-size: 14px; color: #555; margin-bottom: 15px; line-height: 1.6; }
    .credentials-box { background: #F4F6F7; padding: 20px; border-radius: 6px; margin: 20px 0; border: 2px solid #F26522; }
    .credential-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E5E7E9; }
    .credential-row:last-child { border-bottom: none; }
    .credential-label { font-weight: 600; color: #7B8A8B; font-size: 13px; }
    .credential-value { color: #2C3E50; font-size: 14px; font-weight: 600; font-family: 'Courier New', monospace; background: #fff; padding: 4px 8px; border-radius: 3px; }
    .warning-box { background: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .warning-text { font-size: 13px; color: #856404; margin: 0; }
    .cta-button { display: inline-block; background: #F26522; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; font-size: 15px; box-shadow: 0 4px 6px rgba(242, 101, 34, 0.3); }
    .cta-button:hover { background: #E85A1A; }
    .footer { background: #2C3E50; color: #fff; padding: 20px; text-align: center; margin-top: 20px; }
    .footer-text { font-size: 12px; color: #BDC3C7; margin: 5px 0; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <h1 class="header-title" style="font-size: 32px; font-weight: 700; color: #fff; margin: 0 0 8px; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">Prayas Yavatmal</h1>
      <p class="header-subtitle" style="font-size: 13px; color: #fff; opacity: 0.95; font-weight: 500; letter-spacing: 0.5px; margin: 0;">Admin Portal Access</p>
    </div>
    
    <div class="content">
      <h2 class="greeting">Welcome, ${data.adminName}!</h2>
      
      <p class="message">
        You have been granted <strong style="color: #F26522;">${data.role === 'super_admin' ? 'Super Admin' : 'Admin'}</strong> access to the Prayas Yavatmal management system. Below are your login credentials:
      </p>
      
      <div class="credentials-box">
        <div class="credential-row">
          <span class="credential-label">Username:</span>
          <span class="credential-value">${data.username}</span>
        </div>
        <div class="credential-row">
          <span class="credential-label">Email:</span>
          <span class="credential-value">${data.email}</span>
        </div>
        <div class="credential-row">
          <span class="credential-label">Temporary Password:</span>
          <span class="credential-value">${data.temporaryPassword}</span>
        </div>
      </div>
      
      <div class="warning-box">
        <p class="warning-text">
          <strong>⚠️ Security Notice:</strong> This is a temporary password. For security reasons, you must change your password immediately after your first login.
        </p>
      </div>
      
      <div style="text-align: center;">
        <a href="${data.resetLink}" class="cta-button" style="color: #fff; text-decoration: none;">Change Password Now</a>
      </div>
      
      <p class="message" style="margin-top: 20px; font-size: 13px; color: #7B8A8B;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${data.resetLink}" style="color: #F26522; word-break: break-all;">${data.resetLink}</a>
      </p>
      
      <p class="message" style="margin-top: 25px;">
        If you did not expect this email or have any questions, please contact the system administrator immediately.
      </p>
      
      <p class="message" style="margin-top: 20px;">
        Best regards,<br>
        <strong style="color: #F26522;">Prayas Yavatmal Team</strong>
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
