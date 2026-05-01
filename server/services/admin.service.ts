import crypto from 'crypto';
import { sendEmail } from './email.service';
import { getAdminCredentialsEmailTemplate } from '../templates/admin-credentials.template';
import { getPasswordResetSuccessEmailTemplate } from '../templates/password-reset-success.template';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface PasswordResetToken {
  token: string;
  userId: string;
  expiresAt: Date;
}

const resetTokens = new Map<string, PasswordResetToken>();

export function generateResetToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  resetTokens.set(token, { token, userId, expiresAt });
  
  // Clean up expired tokens
  setTimeout(() => resetTokens.delete(token), 24 * 60 * 60 * 1000);
  
  return token;
}

export function validateResetToken(token: string): boolean {
  const tokenData = resetTokens.get(token);
  if (!tokenData) return false;
  
  if (new Date() > tokenData.expiresAt) {
    resetTokens.delete(token);
    return false;
  }
  
  return true;
}

export function consumeResetToken(token: string): string | null {
  const tokenData = resetTokens.get(token);
  if (!tokenData) return null;
  
  const userId = tokenData.userId;
  resetTokens.delete(token);
  return userId;
}

export async function sendAdminCredentials(
  userId: string,
  username: string,
  email: string,
  temporaryPassword: string,
  role: 'super_admin' | 'admin'
): Promise<void> {
  const resetToken = generateResetToken(userId);
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  
  const emailHtml = getAdminCredentialsEmailTemplate({
    adminName: username,
    username,
    email,
    temporaryPassword,
    resetLink,
    role,
  });
  
  await sendEmail({
    to: email,
    subject: 'Welcome to Prayas Yavatmal - Admin Access Granted',
    html: emailHtml,
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const userId = consumeResetToken(token);
  if (!userId) {
    return false;
  }
  
  // Get user details before updating
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (!user) {
    return false;
  }
  
  // Update password in database (in production, hash with bcrypt)
  await db
    .update(users)
    .set({ password: newPassword }) // In production: await bcrypt.hash(newPassword, 10)
    .where(eq(users.id, userId));
  
  // Send confirmation email
  try {
    const emailHtml = getPasswordResetSuccessEmailTemplate({
      adminName: user.username || user.firstName || 'Admin',
      email: user.email,
      resetDate: new Date().toLocaleString('en-IN', { 
        dateStyle: 'medium', 
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata'
      }),
    });
    
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Successful - Prayas Yavatmal',
      html: emailHtml,
    });
  } catch (emailErr) {
    console.error('Failed to send password reset confirmation email:', emailErr);
  }
  
  return true;
}
