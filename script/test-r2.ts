import dotenv from 'dotenv';
dotenv.config();
import { S3Client, ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

console.log('Endpoint:', process.env.R2_ENDPOINT);
console.log('Bucket:', process.env.R2_BUCKET_NAME);
console.log('Key ID:', process.env.R2_ACCESS_KEY_ID?.slice(0,8) + '...');

try {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: 'test-connection.txt',
    Body: Buffer.from('test'),
    ContentType: 'text/plain',
  }));
  console.log('SUCCESS: Upload to R2 works!');
} catch(e) {
  console.error('ERROR:', e.message);
  console.error('Code:', e.Code || e.code);
  console.error('Status:', e.$metadata?.httpStatusCode);
}
