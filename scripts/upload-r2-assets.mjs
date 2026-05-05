/**
 * Upload large LibreOffice WASM assets to Cloudflare R2
 *
 * Usage:
 *   node scripts/upload-r2-assets.mjs
 *
 * Requires environment variables:
 *   R2_ACCOUNT_ID      - Cloudflare account ID
 *   R2_ACCESS_KEY_ID   - R2 access key ID
 *   R2_SECRET_ACCESS_KEY - R2 secret access key
 *   R2_BUCKET_NAME     - R2 bucket name (default: vietpdf-assets)
 *   R2_PUBLIC_URL      - Public CDN URL for the bucket (e.g. https://r2.vietpdf.com)
 */

import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'vietpdf-assets';
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/?$/, '');

const ASSETS_DIR = path.resolve(__dirname, '../assets/libreoffice-wasm');
const FILES_TO_UPLOAD = ['soffice.data.gz', 'soffice.wasm.gz'];

function missingEnv() {
  const missing = [];
  if (!ACCOUNT_ID) missing.push('R2_ACCOUNT_ID');
  if (!ACCESS_KEY_ID) missing.push('R2_ACCESS_KEY_ID');
  if (!SECRET_ACCESS_KEY) missing.push('R2_SECRET_ACCESS_KEY');
  return missing;
}

async function uploadFile(s3, filePath, key) {
  const body = fs.readFileSync(filePath);
  const contentType = key.endsWith('.wasm.gz')
    ? 'application/wasm'
    : key.endsWith('.data.gz')
      ? 'application/octet-stream'
      : 'application/octet-stream';

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    ContentEncoding: 'gzip',
    CacheControl: 'public, max-age=31536000, immutable',
  });

  await s3.send(command);
  const publicUrl = R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL}/${key}`
    : `r2://${BUCKET_NAME}/${key}`;
  console.log(
    `  ✅ Uploaded: ${key} (${(body.length / 1024 / 1024).toFixed(2)} MB) → ${publicUrl}`
  );
}

async function main() {
  const missing = missingEnv();
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:');
    missing.forEach((v) => console.error(`   - ${v}`));
    console.error('\nSet them in your environment or in a .env file.');
    process.exit(1);
  }

  console.log(`☁️  Connecting to Cloudflare R2…`);
  console.log(`   Account: ${ACCOUNT_ID}`);
  console.log(`   Bucket:  ${BUCKET_NAME}`);

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });

  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    console.log('   Bucket exists.\n');
  } catch (err) {
    console.error(`❌ Cannot access bucket "${BUCKET_NAME}":`, err.message);
    console.error(
      '   Make sure the bucket exists and credentials are correct.'
    );
    process.exit(1);
  }

  console.log('📤 Uploading assets…\n');

  for (const fileName of FILES_TO_UPLOAD) {
    const filePath = path.join(ASSETS_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`   ⚠️  Skipping missing file: ${filePath}`);
      continue;
    }
    const key = `libreoffice-wasm/${fileName}`;
    await uploadFile(s3, filePath, key);
  }

  console.log('\n✅ All uploads complete!');
  if (R2_PUBLIC_URL) {
    console.log(`\n   Set this in your environment for builds:`);
    console.log(
      `   VITE_LIBREOFFICE_CDN_URL=${R2_PUBLIC_URL}/libreoffice-wasm/`
    );
  }
}

main().catch((err) => {
  console.error('\n❌ Upload failed:', err.message);
  process.exit(1);
});
