import { generateReceiptPDF, ReceiptData } from './pdf.service';
import { sendEmail } from './email.service';
import { getDonationReceiptEmailTemplate } from '../templates/donation-receipt.template';
import { db } from '../db';
import { donations } from '@shared/schema';
import fs from 'fs';
import path from 'path';

export interface DonationRequest {
  donorName: string;
  donorEmail: string;
  amount: number;
}

export async function processDonation(data: DonationRequest): Promise<{ success: boolean; transactionId: string }> {
  try {
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const date = new Date();

    console.log('Generating PDF receipt...');
    const receiptData: ReceiptData = {
      donorName: data.donorName,
      donorEmail: data.donorEmail,
      amount: data.amount,
      transactionId,
      date,
    };

    const pdfBuffer = await generateReceiptPDF(receiptData);
    console.log('PDF generated, size:', pdfBuffer.length);

    const emailHtml = getDonationReceiptEmailTemplate({
      donorName: data.donorName,
      amount: data.amount,
      transactionId,
      date: date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
      logoBase64: 'cid:logo',
    });

    const logoPath = path.join(process.cwd(), 'client', 'public', 'logo.png');

    console.log('Sending email to:', data.donorEmail);
    await sendEmail({
      to: data.donorEmail,
      subject: 'Donation Receipt - Prayas Yavatmal',
      html: emailHtml,
      attachments: [
        {
          filename: 'logo.png',
          path: logoPath,
          cid: 'logo',
        },
        {
          filename: `receipt-${transactionId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    console.log('Email sent successfully');

    // Save to database
    await db.insert(donations).values({
      donorName: data.donorName,
      donorEmail: data.donorEmail,
      amount: data.amount,
      transactionId,
      status: 'completed',
    });
    console.log('Donation saved to database');

    return { success: true, transactionId };
  } catch (error) {
    console.error('Error in processDonation:', error);
    throw error;
  }
}
