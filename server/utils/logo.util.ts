import fs from 'fs';
import path from 'path';

export function getLogoBase64(): string {
  const logoPath = path.join(process.cwd(), 'client', 'public', 'logo.png');
  
  try {
    if (!fs.existsSync(logoPath)) {
      console.warn('Logo file not found at:', logoPath);
      return '';
    }
    const logoBuffer = fs.readFileSync(logoPath);
    const base64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    console.log('Logo loaded successfully, size:', logoBuffer.length, 'bytes');
    return base64;
  } catch (error) {
    console.error('Error reading logo:', error);
    return '';
  }
}
