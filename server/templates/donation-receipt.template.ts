export interface DonationEmailData {
  donorName: string;
  amount: number;
  transactionId: string;
  date: string;
  logoBase64: string;
}

export function getDonationReceiptEmailTemplate(data: DonationEmailData): string {
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
    .logo { width: 110px; height: 110px; margin: 0 auto 15px; display: block; object-fit: contain; }
    .header-title { font-size: 32px; font-weight: 700; color: #fff; margin: 0 0 8px; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    .header-subtitle { font-size: 13px; color: #fff; opacity: 0.95; font-weight: 500; letter-spacing: 0.5px; }
    .content { padding: 30px 30px; }
    .greeting { font-size: 18px; color: #2C3E50; font-weight: 600; margin-bottom: 15px; }
    .message { font-size: 14px; color: #555; margin-bottom: 15px; line-height: 1.6; }
    .amount-box { background: #F4F6F7; padding: 20px; text-align: center; border-radius: 6px; margin: 20px 0; border: 2px solid #F26522; }
    .amount-label { font-size: 11px; color: #7B8A8B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .amount-value { font-size: 32px; color: #F26522; font-weight: 700; }
    .details-card { background: #F9FAFB; border-radius: 6px; padding: 18px; margin: 18px 0; border-left: 3px solid #F26522; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7E9; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 600; color: #7B8A8B; font-size: 13px; }
    .detail-value { color: #2C3E50; font-size: 13px; font-weight: 500; }
    .footer { background: #2C3E50; color: #fff; padding: 20px; text-align: center; margin-top: 20px; }
    .footer-text { font-size: 12px; color: #BDC3C7; margin: 5px 0; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      ${data.logoBase64 ? `<img src="${data.logoBase64}" alt="Prayas Yavatmal Logo" class="logo" style="width: 110px; height: 110px; display: block; margin: 0 auto 15px; border: none; object-fit: contain;" />` : '<div style="width: 110px; height: 110px; background: #fff; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: bold; color: #F26522;">PY</div>'}
      <h1 class="header-title" style="font-size: 32px; font-weight: 700; color: #fff; margin: 0 0 8px; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">Prayas Yavatmal</h1>
      <p class="header-subtitle" style="font-size: 13px; color: #fff; opacity: 0.95; font-weight: 500; letter-spacing: 0.5px; margin: 0;">Empowering Communities | Transforming Lives</p>
    </div>
    
    <div class="content">
      <h2 class="greeting">Dear ${data.donorName},</h2>
      
      <p class="message">
        Thank you for your generous donation. Your contribution supports our community development initiatives.
      </p>
      
      <div class="amount-box">
        <div class="amount-label">Donation Amount</div>
        <div class="amount-value">Rs. ${data.amount.toLocaleString('en-IN')}</div>
      </div>
      
      <div class="details-card">
        <div class="detail-row">
          <span class="detail-label">Transaction ID:</span>
          <span class="detail-value">${data.transactionId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${data.date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value" style="color: #27AE60; font-weight: 700;">SUCCESS</span>
        </div>
      </div>
      
      <p class="message">
        Your official receipt is attached. Please retain it for your records.
      </p>
      
      <p class="message" style="margin-top: 20px;">
        With gratitude,<br>
        <strong style="color: #F26522;">Prayas Yavatmal</strong>
      </p>
    </div>
    
    <div class="footer">
      <p class="footer-text">info@prayasyavatmal.org | www.prayasyavatmal.org</p>
      <p class="footer-text" style="font-size: 11px; color: #95A5A6; margin-top: 8px;">
        This is a system generated email.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
