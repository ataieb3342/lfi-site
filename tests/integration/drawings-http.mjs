import assert from 'node:assert/strict';
import sharp from 'sharp';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';

const scratch = mkdtempSync(join(tmpdir(), 'lfi-drawings-'));
const origin = 'http://127.0.0.1:5193';
Object.assign(process.env, {
 DATABASE_PATH: join(scratch, 'site.db'), UPLOADS_PATH: join(scratch, 'uploads'),
 BIBLIOTHEQUE_PATH: join(scratch, 'library'), SECRET_KEY: randomBytes(48).toString('base64'),
 MODE_DEMO: '0', NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '5193', ORIGIN: origin
});
const { db } = await import('../../src/lib/server/db.ts');
const { createSession, SESSION_COOKIE } = await import('../../src/lib/server/auth.ts');
const base = db();
base.prepare("insert into admins(id,username,display_name,password_hash,role,created_at,totp_confirmed_at) values(1,'drawing-test','Drawing test','unused','admin',?,?)").run(new Date().toISOString(), new Date().toISOString());
const token = createSession(1, 'test', 'isolated drawing integration test');
const server = spawn(process.execPath, ['build/index.js'], { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
let logs = '';
server.stdout.on('data', b => logs += b);
server.stderr.on('data', b => logs += b);
const png = await sharp({ create: { width: 1600, height: 1000, channels: 4, background: '#9955aa' } }).png().toBuffer();
function fields(overrides = {}, image = true) {
 const f = new FormData();
 for (const [key, value] of Object.entries({ title: 'Integration drawing', author: 'Test author', caption: 'Test caption', alt: 'A test image', rights: 'Test permission', permission: 'on', ...overrides })) f.set(key, value);
 if (image) f.set('image', new File([png], 'original.png', { type: 'image/png' }));
 return f;
}
async function request(path, body, authenticated = true) {
 const r = await fetch(origin + path, { method: body ? 'POST' : 'GET', body, redirect: 'manual', headers: { Accept: 'text/html', ...(body ? { Origin: origin } : {}), ...(authenticated ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}) } });
 return { status: r.status, html: await r.text(), headers: r.headers };
}
try {
 await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(logs)), 15000);
  server.stdout.on('data', chunk => { if (String(chunk).includes('Listening on')) { clearTimeout(timer); resolve(); } });
  server.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited ${code}: ${logs}`)); });
 });
 assert.equal((await request('/admin/dessins', null, false)).status, 303);
 assert.equal((await request('/admin/dessins')).status, 200);
 assert.equal((await request('/admin/dessins?/save', fields({ permission: '' }))).status, 400);
 assert.equal(base.prepare('select count(*) as n from drawings').get().n, 0);
 const fake = fields(); fake.set('image', new File(['<svg onload="alert(1)"></svg>'], 'fake.png', { type: 'image/png' }));
 assert.equal((await request('/admin/dessins?/save', fake)).status, 400);
 assert.equal((await request('/admin/dessins?/save', fields())).status, 303);
 const drawing = base.prepare('select * from drawings').get();
 assert.equal((await request(`/dessins/${drawing.id}`, null, false)).status, 404);
 assert.ok(!(await request('/dessins', null, false)).html.includes('Integration drawing'));
 assert.ok(!(await request('/sitemap.xml', null, false)).html.includes(`/dessins/${drawing.id}`));
 assert.equal((await request('/admin/dessins?/save', fields({ id: String(drawing.id), published: 'on' }, false))).status, 303);
 const publicPage = await request(`/dessins/${drawing.id}`, null, false);
 assert.equal(publicPage.status, 200);
 assert.ok(publicPage.html.includes('Test author'));
 assert.ok(publicPage.html.includes('Test permission'));
 assert.ok(publicPage.html.includes('Télécharger'));
 const media = base.prepare('select * from media where id=?').get(drawing.media_id);
 assert.ok(publicPage.html.includes(`property="og:image" content="${origin}/media/${media.filename}"`));
 assert.ok((await request('/dessins', null, false)).html.includes('Integration drawing'));
 assert.ok((await request('/sitemap.xml', null, false)).html.includes(`/dessins/${drawing.id}`));
 const image = await fetch(`${origin}/media/${media.filename}`);
 assert.equal(image.headers.get('content-type'), 'image/png');
 assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
 const thumbnail = await fetch(`${origin}/media/${media.filename}/vignette`);
 assert.equal(thumbnail.headers.get('content-type'), 'image/webp');
 const thumbnailBytes = Buffer.from(await thumbnail.arrayBuffer());
 const dimensions = await sharp(thumbnailBytes).metadata();
 assert.equal(dimensions.width, 640);
 assert.equal(dimensions.height, 400, 'The thumbnail preserves the whole image and its proportions');
 assert.ok(thumbnailBytes.length < png.length);
 const cachedThumbnail = await fetch(`${origin}/media/${media.filename}/vignette`);
 assert.deepEqual(Buffer.from(await cachedThumbnail.arrayBuffer()), thumbnailBytes);
 assert.equal((await fetch(`${origin}/media/unknown.png/vignette`)).status, 404);
 assert.ok((await request('/dessins', null, false)).html.includes(`/media/${media.filename}/vignette`));

 const deletion = new FormData(); deletion.set('id', String(media.id));
 assert.equal((await request('/admin/medias?/supprimer', deletion)).status, 400);
 assert.ok(base.prepare('select id from media where id=?').get(media.id));
 assert.equal((await request('/admin/dessins?/save', fields({ id: String(drawing.id), title: 'Updated drawing' }, false))).status, 303);
 assert.equal((await request(`/dessins/${drawing.id}`, null, false)).status, 404);
 const remove = new FormData(); remove.set('id', String(drawing.id));
 assert.equal((await request('/admin/dessins?/delete', remove)).status, 303);
 assert.equal(base.prepare('select count(*) as n from drawings').get().n, 0);
 assert.ok(base.prepare('select id from media where id=?').get(media.id));
 assert.equal((await request('/admin/dessins?/save', fields({ published: 'on' }))).status, 303);
 const next = base.prepare('select id from drawings').get();
 const third = await request('/admin/dessins?/save', fields({ title: 'Third drawing', published: 'on' }));
 assert.equal(third.status, 303);
 const visible = base.prepare('select id from drawings where published=1 order by created_at desc,id desc').all();
 const newestPage = (await request(`/dessins/${visible[0].id}`, null, false)).html;
 assert.ok(newestPage.includes(`href="/dessins/${visible[1].id}"`));
 assert.ok(!newestPage.includes(`href="/dessins/${drawing.id}"`), 'Draft and removed neighbours are excluded');
 assert.ok(newestPage.includes('drawing-reader'));
 assert.ok(next.id > drawing.id, 'A deleted shared URL must never identify a new drawing');
 assert.equal((await request(`/dessins/${drawing.id}`, null, false)).status, 404);
 assert.equal((await request('/dessins/not-an-id', null, false)).status, 404);
 assert.equal(base.prepare("select count(*) as n from audit_log where action like 'drawing.%'").get().n, 6);
 console.log('PASS drawings: authenticated upload, permission, content sniffing, drafts, publication, metadata, original bytes, image protection, unpublishing, deletion and audit.');
} finally {
 server.kill('SIGTERM');
}
