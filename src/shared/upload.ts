import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import type { MultipartFile } from '@fastify/multipart';

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function assertSafeSubfolder(subfolder: string): void {
  const normalized = path.normalize(subfolder);
  if (
    normalized.includes('..') ||
    path.isAbsolute(normalized) ||
    normalized.startsWith('..')
  ) {
    throw new Error('Invalid upload subfolder');
  }
}

export async function saveUploadedFile(
  file: MultipartFile,
  subfolder: string,
): Promise<string> {
  assertSafeSubfolder(subfolder);

  const ext = path.extname(file.filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error('Invalid file type. Allowed: jpg, jpeg, png, webp');
  }

  if (file.file.truncated) {
    throw new Error('File exceeds maximum size of 10MB');
  }

  const filename = `${crypto.randomUUID()}${ext}`;
  const uploadsRoot = path.join(process.cwd(), 'uploads');
  const dir = path.join(uploadsRoot, subfolder);

  if (!dir.startsWith(uploadsRoot)) {
    throw new Error('Invalid upload path');
  }

  await fs.promises.mkdir(dir, { recursive: true });

  const filepath = path.join(dir, filename);
  await pipeline(file.file, fs.createWriteStream(filepath));

  return `/uploads/${subfolder}/${filename}`;
}
