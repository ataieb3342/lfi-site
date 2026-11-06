import sharp from 'sharp';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { UPLOADS_DIR, type Media } from './media.ts';

const pending = new Map<string, Promise<Buffer>>();
const directory = join(UPLOADS_DIR, '.thumbnails');
export const THUMBNAIL_EDGE = 640;
export function thumbnailPath(filename: string) {
 return join(directory, `${filename}.webp`);
}

/** Fixed dimensions and shared jobs prevent arbitrary transformations on public requests. */
export async function getThumbnail(media: Media): Promise<Buffer> {
 const cached = thumbnailPath(media.filename);
 try { return await readFile(cached); } catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
 }
 const existing = pending.get(media.filename);
 if (existing) return existing;
 const job = (async () => {
  const bytes = await sharp(join(UPLOADS_DIR, media.filename), { limitInputPixels: 40_000_000 })
   .rotate().resize(THUMBNAIL_EDGE, THUMBNAIL_EDGE, { fit: 'inside', withoutEnlargement: true })
   .webp({ quality: 82, effort: 3 }).toBuffer();
  await mkdir(directory, { recursive: true });
  const temporary = `${cached}.${randomUUID()}.tmp`;
  try { await writeFile(temporary, bytes, { flag: 'wx' }); await rename(temporary, cached); }
  finally { await unlink(temporary).catch(() => {}); }
  return bytes;
 })();
 pending.set(media.filename, job);
 try { return await job; } finally { pending.delete(media.filename); }
}
