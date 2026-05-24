import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import type { MultipartFile } from '@fastify/multipart';

export async function saveUploadedFile(
  file: MultipartFile,
  subfolder: string,
): Promise<string> {
  const ext = path.extname(file.filename);
  const filename = `${crypto.randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), 'uploads', subfolder);

  await fs.promises.mkdir(dir, { recursive: true });

  const filepath = path.join(dir, filename);
  await pipeline(file.file, fs.createWriteStream(filepath));

  return `/uploads/${subfolder}/${filename}`;
}
