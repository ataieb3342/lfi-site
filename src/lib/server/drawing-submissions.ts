import { mkdir, readFile, unlink, writeFile, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { db, now } from './db.ts';
import { UPLOADS_DIR, MAX_UPLOAD_BYTES, sniffImage } from './media.ts';
import { saveDrawing, type DrawingFields } from './drawings.ts';

const privateDirectory = join(UPLOADS_DIR, '.drawing-submissions');
export type DrawingSubmission = Omit<DrawingFields, 'published'> & {
 id: number; filename: string; mime: string; bytes: number; created_at: string;
};
export function countDrawingSubmissions(): number {
 return Number((db().prepare('select count(*) as n from drawing_submissions').get() as { n: number }).n);
}
export function listDrawingSubmissions(): DrawingSubmission[] {
 return db().prepare('select * from drawing_submissions order by id asc').all() as DrawingSubmission[];
}
export function getDrawingSubmission(id: number): DrawingSubmission | undefined {
 if (!Number.isSafeInteger(id) || id <= 0) return undefined;
 return db().prepare('select * from drawing_submissions where id=?').get(id) as DrawingSubmission | undefined;
}
export async function readSubmissionImage(submission: DrawingSubmission) {
 return readFile(join(privateDirectory, submission.filename));
}
export async function createDrawingSubmission(fields: DrawingFields, file: File) {
 if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) throw new Error('Choisissez une image de 5 Mo maximum.');
 const bytes = Buffer.from(await file.arrayBuffer());
 const kind = sniffImage(bytes);
 if (!kind) throw new Error('Format non reconnu. Utilisez une image JPEG, PNG, WebP, GIF ou AVIF.');
 try { await sharp(bytes, { limitInputPixels: 40_000_000 }).resize(1, 1).toBuffer(); }
 catch { throw new Error('Cette image est illisible ou trop grande. Choisissez un autre fichier.'); }
 const filename = `${randomUUID()}.${kind.ext}`;
 await mkdir(privateDirectory, { recursive: true });
 await writeFile(join(privateDirectory, filename), bytes, { flag: 'wx', mode: 0o600 });
 try {
  // Recheck after asynchronous decoding to bound disk use under concurrent requests.
  if (countDrawingSubmissions() >= 100) throw new Error('La file de vérification est pleine. Réessayez plus tard.');
  return Number(db().prepare('insert into drawing_submissions(title,author,caption,alt,rights,filename,mime,bytes,created_at) values(?,?,?,?,?,?,?,?,?)')
   .run(fields.title, fields.author, fields.caption, fields.alt, fields.rights, filename, kind.mime, bytes.length, now()).lastInsertRowid);
 } catch (error) { await unlink(join(privateDirectory, filename)).catch(() => {}); throw error; }
}
export async function approveDrawingSubmission(id: number, fields: DrawingFields, adminId: number) {
 const submission = getDrawingSubmission(id);
 if (!submission) throw new Error('Proposition déjà traitée ou introuvable.');
 const filename = `${randomUUID()}.${submission.filename.split('.').pop()}`;
 const destination = join(UPLOADS_DIR, filename);
 await copyFile(join(privateDirectory, submission.filename), destination);
 let drawingId: number;
 db().exec('begin');
 try {
  if (!getDrawingSubmission(id)) throw new Error('Proposition déjà traitée.');
  const media = db().prepare('insert into media(filename,mime,bytes,alt,created_at,uploaded_by) values(?,?,?,?,?,?)')
   .run(filename, submission.mime, submission.bytes, fields.alt, now(), adminId);
  drawingId = saveDrawing(null, { ...fields, published: 1 }, Number(media.lastInsertRowid));
  db().prepare('delete from drawing_submissions where id=?').run(id);
  db().exec('commit');
 } catch (error) { db().exec('rollback'); await unlink(destination).catch(() => {}); throw error; }
 await unlink(join(privateDirectory, submission.filename)).catch(() => {});
 return drawingId;
}
export async function rejectDrawingSubmission(id: number) {
 const submission = getDrawingSubmission(id);
 if (!submission) throw new Error('Proposition déjà traitée ou introuvable.');
 db().prepare('delete from drawing_submissions where id=?').run(id);
 await unlink(join(privateDirectory, submission.filename)).catch(() => {});
}
