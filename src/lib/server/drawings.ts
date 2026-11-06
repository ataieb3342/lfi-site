import { db, now } from './db.ts';

export type Drawing = {
 id: number; title: string; author: string; caption: string; alt: string;
 rights: string; media_id: number; published: number; created_at: string; updated_at: string;
};
export type DrawingFields = Pick<Drawing, 'title' | 'author' | 'caption' | 'alt' | 'rights' | 'published'>;

export function listDrawings(includeDrafts = false): Drawing[] {
 return db().prepare(`select * from drawings ${includeDrafts ? '' : 'where published = 1'} order by created_at desc, id desc`).all() as Drawing[];
}
export function getDrawing(id: number, includeDrafts = false): Drawing | undefined {
 if (!Number.isSafeInteger(id) || id <= 0) return undefined;
 return db().prepare(`select * from drawings where id = ? ${includeDrafts ? '' : 'and published = 1'}`).get(id) as Drawing | undefined;
}
export function readDrawingFields(form: FormData, requirePermission = true): DrawingFields {
 const title = String(form.get('title') ?? '').trim();
 const author = String(form.get('author') ?? '').trim();
 const caption = String(form.get('caption') ?? '').trim();
 const alt = String(form.get('alt') ?? '').trim();
 const rights = String(form.get('rights') ?? '').trim();
 if (!title || title.length > 180) throw new Error('Indiquez un titre de 180 caractères maximum.');
 if (!author || author.length > 120) throw new Error('Indiquez le nom ou pseudonyme de l’auteur (120 caractères maximum).');
 if (!alt || alt.length > 300) throw new Error('Décrivez le dessin en 300 caractères maximum.');
 if (caption.length > 2000 || rights.length > 500) throw new Error('La légende ou les conditions de partage sont trop longues.');
 if (!rights) throw new Error('Précisez les conditions de partage convenues avec l’auteur.');
 if (requirePermission && form.get('permission') !== 'on') throw new Error('Confirmez l’autorisation de publication de ce dessin.');
 return { title, author, caption, alt, rights, published: form.get('published') === 'on' ? 1 : 0 };
}
export function saveDrawing(id: number | null, fields: DrawingFields, mediaId: number): number {
 const values = [fields.title, fields.author, fields.caption, fields.alt, fields.rights, mediaId, fields.published];
 if (id !== null) {
  db().prepare('update drawings set title=?, author=?, caption=?, alt=?, rights=?, media_id=?, published=?, updated_at=? where id=?').run(...values, now(), id);
  return id;
 }
 const timestamp = now();
 return Number(db().prepare('insert into drawings(title,author,caption,alt,rights,media_id,published,created_at,updated_at) values(?,?,?,?,?,?,?,?,?)').run(...values, timestamp, timestamp).lastInsertRowid);
}
export function deleteDrawing(id: number) {
 db().prepare('delete from drawings where id = ?').run(id);
}
