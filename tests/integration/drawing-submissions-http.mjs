import assert from 'node:assert/strict';
import sharp from 'sharp';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes, createHash } from 'node:crypto';
import { spawn } from 'node:child_process';

const scratch = mkdtempSync(join(tmpdir(), 'lfi-drawing-submissions-'));
const origin = 'http://127.0.0.1:5194';
Object.assign(process.env, {
 DATABASE_PATH: join(scratch, 'site.db'), UPLOADS_PATH: join(scratch, 'uploads'),
 BIBLIOTHEQUE_PATH: join(scratch, 'library'), SECRET_KEY: randomBytes(48).toString('base64'),
 MODE_DEMO: '0', NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '5194', ORIGIN: origin
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
const { createChallenge } = await import('../../src/lib/server/captcha.ts');
function proof() {
 const challenge = createChallenge();
 for (let number=0; number<=challenge.maxnumber; number++) {
  if (createHash('sha256').update(challenge.salt + number).digest('hex') === challenge.challenge) return Buffer.from(JSON.stringify({ salt: challenge.salt, number, expires: challenge.expires, signature: challenge.signature })).toString('base64');
 }
 throw new Error('Invalid test challenge');
}
function proposal(overrides={}) { const form=fields(overrides); form.set('preuve',proof()); return form; }
try {
 await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(logs)), 15000);
  server.stdout.on('data', chunk => { if (String(chunk).includes('Listening on')) { clearTimeout(timer); resolve(); } });
  server.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited ${code}: ${logs}`)); });
 });
 assert.equal((await request('/dessins/proposer', null, false)).status,200);
 assert.equal((await request('/dessins/proposer', proposal({permission:''}),false)).status,400);
 assert.equal(base.prepare('select count(*) as n from drawing_submissions').get().n,0);
 const trap=proposal({site:'spam'});
 assert.equal((await request('/dessins/proposer',trap,false)).status,200);
 assert.equal(base.prepare('select count(*) as n from drawing_submissions').get().n,0);
 const csrf=await fetch(origin+'/dessins/proposer',{method:'POST',body:proposal(),redirect:'manual',headers:{Origin:'https://example.invalid',Accept:'text/html'}});
 assert.equal(csrf.status,403);

 const invalid=proposal(); invalid.set('image',new File(['<svg>fake</svg>'],'image.png',{type:'image/png'}));
 assert.equal((await request('/dessins/proposer',invalid,false)).status,400);
 const submission=proposal({title:'Guest proposal',published:'on',id:'999'});
 const sent=await request('/dessins/proposer',submission,false);
 assert.equal(sent.status,200); assert.ok(sent.html.includes('Merci pour votre proposition'));
 const pending=base.prepare('select * from drawing_submissions').get();
 assert.ok(pending);
 assert.equal(base.prepare('select count(*) as n from drawings').get().n,0,'Public submissions cannot publish themselves');
 assert.equal(base.prepare('select count(*) as n from media').get().n,0,'Unapproved images never enter the public media library');
 assert.ok(!(await request('/dessins',null,false)).html.includes('Guest proposal'));
 assert.ok(!(await request('/sitemap.xml',null,false)).html.includes(`/dessins/${pending.id}`));
 assert.equal((await request(`/media/${pending.filename}`,null,false)).status,404);
 assert.equal((await request(`/media/${pending.filename}/vignette`,null,false)).status,404);
 const privateUrl=`/admin/dessins/propositions/${pending.id}/image`;
 assert.equal((await request(privateUrl,null,false)).status,303);
 const image=await fetch(origin+privateUrl,{headers:{Cookie:`${SESSION_COOKIE}=${token}`}});
 assert.equal(image.status,200); assert.ok(image.headers.get('cache-control').includes('no-store'));
 assert.deepEqual(Buffer.from(await image.arrayBuffer()),png);
 assert.ok((await request('/admin/dessins')).html.includes('Guest proposal'));
 base.prepare("insert into admins(id,username,display_name,password_hash,role,created_at) values(2,'no2fa','No 2FA','unused','admin',?)").run(new Date().toISOString());
 const no2faToken=createSession(2,'test','missing 2fa test');
 assert.equal((await fetch(origin+privateUrl,{headers:{Cookie:`${SESSION_COOKIE}=${no2faToken}`},redirect:'manual'})).status,403);

 const approval=fields({submissionId:String(pending.id),title:'Reviewed proposal'},false);
 for (const action of ['save','delete','approve','reject']) {
  const blocked=await fetch(origin+`/admin/dessins?/${action}`,{method:'POST',body:approval,redirect:'manual',headers:{Origin:origin,Accept:'text/html',Cookie:`${SESSION_COOKIE}=${no2faToken}`}});
  assert.ok(blocked.status === 403 || (blocked.status === 303 && blocked.headers.get('location') === '/admin/double-authentification'), `${action} requires enabled two-factor authentication`);
  assert.equal(base.prepare('select count(*) as n from drawings').get().n,0);
  assert.ok(base.prepare('select id from drawing_submissions where id=?').get(pending.id));
 }

 assert.equal((await request('/admin/dessins?/approve',approval,false)).status,303);
 assert.ok(base.prepare('select id from drawing_submissions where id=?').get(pending.id));
 assert.equal((await request('/admin/dessins?/approve',approval)).status,303);
 assert.equal(base.prepare('select count(*) as n from drawing_submissions').get().n,0);
 const published=base.prepare('select * from drawings').get();
 assert.equal(published.title,'Reviewed proposal'); assert.equal(published.published,1);
 assert.ok((await request(`/dessins/${published.id}`,null,false)).html.includes('Reviewed proposal'));
 assert.ok(!existsSync(join(process.env.UPLOADS_PATH,'.drawing-submissions',pending.filename)));
 const media=base.prepare('select * from media where id=?').get(published.media_id);
 const original=await fetch(origin+`/media/${media.filename}`);
 assert.deepEqual(Buffer.from(await original.arrayBuffer()),png);
 assert.equal((await request('/admin/dessins?/approve',approval)).status,404);
 assert.equal(base.prepare('select count(*) as n from drawings').get().n,1);
 assert.equal((await request('/dessins/proposer',proposal({title:'Rejected proposal'}),false)).status,200);
 const rejected=base.prepare('select * from drawing_submissions').get();
 const rejection=new FormData(); rejection.set('submissionId',String(rejected.id));
 assert.equal((await request('/admin/dessins?/reject',rejection)).status,303);
 assert.equal(base.prepare('select count(*) as n from drawing_submissions').get().n,0);
 assert.ok(!existsSync(join(process.env.UPLOADS_PATH,'.drawing-submissions',rejected.filename)));
 assert.ok(!(await request('/dessins',null,false)).html.includes('Rejected proposal'));
 const replay=fields(); replay.set('preuve',String(submission.get('preuve')));
 assert.equal((await request('/dessins/proposer',replay,false)).status,429,'Replayed proof cannot obtain the verified submission quota');
 assert.equal(base.prepare("select count(*) as n from audit_log where action in ('drawing.approve','drawing.reject')").get().n,2);
 console.log('PASS collaborative drawings: guest submission, permissions, real image decoding, private files, forced moderation, authenticated approval, no duplicate publication, rejection, anti-spam and audit.');

} finally {
 server.kill('SIGTERM');
}
