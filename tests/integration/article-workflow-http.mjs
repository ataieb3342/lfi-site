import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const root = resolve(import.meta.dirname, '../..');
const scratch = mkdtempSync(join(tmpdir(), 'lfi-workflow-http-'));
const port = Number(process.env.TEST_PORT || 5191);
const origin = `http://127.0.0.1:${port}`;
Object.assign(process.env, {
 DATABASE_PATH: join(scratch, 'site.db'), UPLOADS_PATH: join(scratch, 'uploads'),
 BIBLIOTHEQUE_PATH: join(scratch, 'library'), SECRET_KEY: randomBytes(48).toString('base64'),
 MODE_DEMO: '0', NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(port), ORIGIN: origin
});
const { db } = await import('../../src/lib/server/db.ts');
const { createSession, SESSION_COOKIE } = await import('../../src/lib/server/auth.ts');
const { getById } = await import('../../src/lib/server/content.ts');
const { getReview, countArticlesAwaitingReview } = await import('../../src/lib/server/reviews.ts');
const base = db();
const tokens = new Map();
for (const [index, name] of ['Author', 'Reviewer', 'Third reviewer', 'Other admin'].entries()) {
 const id = index + 1;
 base.prepare("insert into admins(id,username,display_name,password_hash,role,created_at,totp_confirmed_at) values(?,?,?,'unused','admin',?,?)")
 .run(id, `test${id}`, name, new Date().toISOString(), new Date().toISOString());
 tokens.set(id, createSession(id, 'test', 'isolated integration test'));
}
const server = spawn(process.execPath, [join(root, 'build/index.js')], { cwd: root, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '';
server.stdout.on('data', chunk => { serverLog += chunk; });
server.stderr.on('data', chunk => { serverLog += chunk; });
const cleanHtml = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
async function request(path, actor, fields, extraHeaders = {}, multipart = false) {
 const headers = { accept: 'text/html', ...(actor ? { cookie: `${SESSION_COOKIE}=${tokens.get(actor)}` } : {}), ...extraHeaders };
 if (fields) { if (!multipart) headers['content-type']='application/x-www-form-urlencoded'; headers.origin ??= origin; }
 let body;
 if (fields) { if(multipart) {body=new FormData();for(const [key,value] of Object.entries(fields)) body.set(key,value);}else body=new URLSearchParams(fields); }
 const response = await fetch(origin + path, { method: fields ? 'POST' : 'GET', headers, body, redirect: 'manual', signal: AbortSignal.timeout(15000) });
 return { status: response.status, location: response.headers.get('location'), html: cleanHtml(await response.text()) };
}
function fields(id, overrides = {}) {
 const p = getById(id);
 return { title: p.title, summary: p.summary, body: p.body, kind: p.kind === 'actu' ? p.event_category === 'formation' ? 'formation' : 'reunion' : p.kind,
 status: p.status, layoutStyle: p.layout_style, authorAdminId: String(p.byline_admin_id ?? ''), authorName: p.author_name,
 commentsOpen: String(p.comments_open), reviewRevision: String(getReview(id).revision), eventAt: p.event_at ?? '',
 eventStartTime: p.event_start_time, eventEndTime: p.event_end_time, eventLocation: p.event_location,
 ...overrides };
}
async function create(title, kind = 'article', actor = 1) {
 const result = await request('/admin/publications/nouvelle?/creer', actor, { kind, title, summary: 'Integration example', body: 'Original text', layoutStyle: 'standard', status: kind === 'article' ? 'draft' : 'published', authorAdminId: '1', commentsOpen: '1', eventAt: kind === 'article' ? '' : '2026-12-01' });
 assert.equal(result.status, 303, `${title}: ${result.html.slice(0, 200)}`);
 return Number(result.location.match(/publications\/(\d+)/)[1]);
}
async function decide(id, actor, decision, note = '', target = '') {
 return request(`/admin/publications/${id}?/verifier`, actor, { decision, note, target: String(target), revision: String(getReview(id).revision) });
}
async function submit(id) {
 const result = await request(`/admin/publications/${id}?/enregistrer`, 1, fields(id, { articleAction: 'submit' }));
 assert.equal(result.status, 303, 'Author submission');
}
let checks = 0;
function passed(message) { checks++; console.log(`PASS ${message}`); }
try {
 await new Promise((accept, reject) => {
 const timeout = setTimeout(() => reject(new Error(`Server startup timed out: ${serverLog.slice(-500)}`)), 15000);
 const check = chunk => { if (String(chunk).includes('Listening on')) { clearTimeout(timeout); accept(); } };
 server.stdout.on('data', check);
 server.once('exit', code => { clearTimeout(timeout); reject(new Error(`Server exited ${code}: ${serverLog.slice(-500)}`)); });
 });
 assert.equal((await request('/admin/verifications')).status, 303);
 passed('Administration requires a valid session');
 const creationView=(await request('/admin/publications/nouvelle',1)).html;
 assert.ok(creationView.includes('Enregistrer et soumettre'));
 assert.ok(creationView.includes('Enregistrer le brouillon'));
 assert.doesNotMatch(creationView,/<select[^>]*name="status"/);
 const draftFields={kind:'article',title:'One-step submission',summary:'Summary',body:'Ready to review',status:'draft',authorAdminId:'1',articleAction:'submit',commentsOpen:'1'};
 const countBeforeCreation=base.prepare('select count(*) as n from publications').get().n;
 for (const overrides of [{authorAdminId:'2'},{title:''}]) {
 assert.equal((await request('/admin/publications/nouvelle?/creer',1,{...draftFields,...overrides})).status,400);
 assert.equal(base.prepare('select count(*) as n from publications').get().n,countBeforeCreation);
 }
 const created=await request('/admin/publications/nouvelle?/creer',1,draftFields);
 assert.equal(created.status,303);
 assert.equal(created.location,'/admin/verifications?onglet=mes-articles&soumis=1');
 const submittedId=base.prepare('select id from publications where title=?').get(draftFields.title).id;
 assert.equal(getById(submittedId).status,'draft');
 assert.equal(getReview(submittedId).author_approved_by,1);
 assert.ok((await request(created.location,1)).html.includes('Article enregistré et soumis à la relecture'));
 assert.ok((await request('/admin/verifications?onglet=a-verifier',2)).html.includes(draftFields.title));
 assert.equal((await decide(submittedId,2,'approve')).status,303);
 assert.equal((await request(`/admin/publications/${submittedId}?/enregistrerEtPublier`,1,fields(submittedId))).status,303);
 assert.equal(getById(submittedId).status,'published');
 passed('Creation saves and submits in one step, while invalid submissions leave no orphan drafts');
 for (const action of ['creer', 'creerEtUne']) {
 const count = base.prepare('select count(*) as n from publications').get().n;
 const direct = await request(`/admin/publications/nouvelle?/${action}`, 1, {
 kind: 'article', title: 'Direct publication attempt', summary: 'Must remain unpublished',
 body: 'Unreviewed text', status: 'published', authorAdminId: '1', commentsOpen: '1'
 });
 assert.equal(direct.status, 400);
 assert.equal(base.prepare('select count(*) as n from publications').get().n, count);
 }
 passed('Article creation rejects direct publication, including the front-page shortcut');
 const id = await create('HTTP review journey');
 assert.equal((await request(`/articles/${getById(id).slug}`)).status, 404);
 assert.ok((await request(`/admin/publications/${id}`, 1)).html.includes('Enregistrer et soumettre'));
 await submit(id);
 const authorView = (await request(`/admin/publications/${id}`, 1)).html;
 assert.ok(authorView.includes('Votre article attend une relecture'));
 assert.ok(authorView.includes('id="publication-edit"'));
 assert.ok(!/<button[^>]*>Valider cet article<\/button>/.test(authorView));
 const staleFields=fields(id,{body:'Stale reviewer changes'});
 assert.equal((await request(`/admin/publications/${id}?/enregistrer`, 1, fields(id, { body: 'Author update during review' }))).status, 303);
 assert.equal(getById(id).body, 'Author update during review');
 assert.equal(getReview(id).author_approved_by,1);
 assert.equal((await request(`/admin/publications/${id}?/enregistrer`,2,staleFields)).status,400);
 assert.equal(getById(id).body,'Author update during review');
 assert.equal((await decide(id, 1, 'approve')).status, 400);
 passed('Author editing remains available during review while stale saves and self-approval are rejected');
 assert.equal((await decide(id, 2, 'comment', 'Useful comment')).status, 303);
 assert.equal(getById(id).body, 'Author update during review');
 assert.equal(getReview(id).reviewer_id, null);
 assert.ok((await request(`/admin/publications/${id}`, 1)).html.includes('Useful comment'));
 assert.equal(countArticlesAwaitingReview(1), 0);
 assert.equal(countArticlesAwaitingReview(2), 1);
 passed('Comments preserve state and personal counters exclude own articles');
 const reviewerView = (await request(`/admin/publications/${id}`, 2)).html;
 assert.match(reviewerView, /<button[^>]*form="publication-edit"[^>]*formaction="\?\/enregistrerEtValider"[^>]*>Valider cet article<\/button>/);
 assert.ok(reviewerView.includes('id="publication-edit"'));
 const revision = getReview(id).revision;
 assert.equal((await request(`/admin/publications/${id}?/enregistrerEtValider`, 2, fields(id, { title: '', body: 'Invalid revision' }))).status, 400);
 assert.equal(getById(id).body, 'Author update during review');
 assert.equal((await request(`/admin/publications/${id}?/enregistrerEtValider`, 2, fields(id, { body: 'Corrected and approved text' }))).status, 303);
 assert.equal(getById(id).body, 'Corrected and approved text');
 assert.equal(getReview(id).reviewer_id, 2);
 assert.equal(getReview(id).revision, revision + 1);
 assert.equal(getById(id).status, 'draft');
 assert.equal(countArticlesAwaitingReview(2), 0);
 assert.ok((await request(`/admin/publications/${id}`, 2)).html.includes('Vous avez validé cet article'));
 passed('Main approval action saves corrections atomically and confirms success');
 const approved = getById(id);
 for (const actor of [1, 2]) {
 for (const action of ['enregistrer', 'enregistrerEtUne', ...(actor === 2 ? ['enregistrerEtValider'] : [])]) {
 const direct = await request(`/admin/publications/${id}?/${action}`, actor, fields(id, { status: 'published' }));
 assert.equal(direct.status, 400, `Direct publication through ${action} by admin ${actor}`);
 assert.deepEqual(getById(id), approved);
 }
 }
 passed('Saving or pinning a reviewed draft cannot bypass the author publication action');
 assert.equal((await request(`/admin/publications/${id}?/publier`, 2, { revision: String(getReview(id).revision) })).status, 400);
 assert.equal((await request(`/admin/publications/${id}?/publier`, 1, { revision: String(revision) })).status, 400);
 assert.ok((await request(`/admin/publications/${id}`, 1)).html.includes('>Publier</button>'));
 assert.equal((await request(`/admin/publications/${id}?/enregistrerEtPublier`,2,fields(id))).status,400);
 const editedPublication=await request(`/admin/publications/${id}?/enregistrerEtPublier`,1,fields(id,{body:'Final author changes'}));
 assert.equal(editedPublication.status,303);
 assert.ok(editedPublication.location.includes('relecture=1'));
 assert.equal(getById(id).status,'draft');
 assert.equal(getById(id).body,'Final author changes');
 assert.equal(getReview(id).author_approved_by,1);
 assert.equal(getReview(id).reviewer_id,null);
 assert.equal((await request(`/articles/${getById(id).slug}`)).status,404);
 assert.equal((await decide(id,2,'approve')).status,303);
 assert.equal((await request(`/admin/publications/${id}?/enregistrerEtPublier`,1,fields(id))).status,303);
 assert.equal(getById(id).status, 'published');
 assert.equal((await request(`/articles/${getById(id).slug}`)).status, 200);
 passed('Publication saves the form and requires renewed review for changes without another submission');
 const enhanced = await create('Enhanced form journey');
 await submit(enhanced);
 const ajax = await request(`/admin/publications/${enhanced}?/enregistrerEtValider`, 2, fields(enhanced, { body:'Saved through the enhanced multipart form' }), {accept:'application/json','x-sveltekit-action':'true'}, true);
 assert.equal(ajax.status,200);
 assert.equal(JSON.parse(ajax.html).type,'redirect');
 assert.equal(getById(enhanced).body,'Saved through the enhanced multipart form');
 assert.equal(getReview(enhanced).reviewer_id,2);
 passed('Enhanced multipart form follows the same save-and-approve path');
 const beforeForgery=getById(enhanced);
 const forgery=await request(`/admin/publications/${enhanced}?/enregistrer`,2,fields(enhanced,{body:'Cross-origin edit'}),{origin:'https://invalid.example'});
 assert.equal(forgery.status,403);
 assert.deepEqual(getById(enhanced),beforeForgery);
 passed('Cross-origin form submissions are rejected without changes');
 const third = await create('Third opinion journey');
 await submit(third);
 assert.equal((await decide(third, 2, 'request', 'Please check this', 3)).status, 303);
 assert.equal(countArticlesAwaitingReview(2), 0);
 assert.equal(countArticlesAwaitingReview(3), 1);
 assert.equal((await request(`/admin/publications/${third}?/enregistrerEtValider`, 2, fields(third))).status, 400);
 assert.equal((await decide(third, 4, 'approve')).status, 400);
 assert.equal((await decide(third, 3, 'corrections', 'Please complete the source')).status, 303);
 assert.ok((await request(`/admin/publications/${third}`, 1)).html.includes('Enregistrer et soumettre'));
 await submit(third);
 const before = getById(third);
 assert.equal((await request(`/admin/publications/${third}?/enregistrerEtValider`, 2, fields(third, { authorAdminId: '2', title: 'Wrong owner' }))).status, 400);
 assert.deepEqual(getById(third), before);
 passed('Third opinions restrict action to their recipient and corrections restore author editing');
 const advice = await create('Informal advice journey');
 assert.equal((await decide(advice, 1, 'advice', 'What do you think?', 2)).status, 303);
 assert.ok((await request('/admin/verifications?onglet=a-verifier', 2)).html.includes('Informal advice journey'));
 assert.ok(!(await request('/admin/verifications?onglet=a-verifier', 3)).html.includes('Informal advice journey'));
 assert.equal((await decide(advice, 2, 'approve')).status, 400);
 assert.equal((await decide(advice, 2, 'advice_reply', 'This is clear')).status, 303);
 assert.equal(getReview(advice).author_approved_by, null);
 assert.equal(getReview(advice).reviewer_id, null);
 passed('Informal advice is private to the recipient and does not submit or approve drafts');
 for (const kind of ['reunion', 'formation', 'apero']) {
 const event = await create(`Existing ${kind} workflow`, kind, 2);
 assert.equal(getById(event).status, 'published');
 const html = (await request(`/admin/publications/${event}`, 2)).html;
 assert.doesNotMatch(html, /aria-label="Suivi de l(?:'|&#39;)article"/);
 assert.doesNotMatch(html, /<button[^>]*>Valider cet article<\/button>/);
 assert.ok(html.includes('Enregistrer et mettre à la une'));
 assert.equal((await request(`/admin/publications/${event}?/enregistrer`, 2, fields(event, { title: `Updated ${kind}` }))).status, 303);
 assert.equal(getById(event).status, 'published');
 assert.equal((await request(`/admin/publications/${event}?/enregistrerEtUne`, 2, fields(event))).status, 303);
 assert.equal(getById(event).pinned, 1);
 }
 passed('Events, training sessions and aperos still publish, edit and pin without article review');
 for (const path of ['/admin/publications', '/admin/a-la-une', '/admin/commentaires', '/admin/sources', '/admin/medias', '/admin/reglages', '/agenda', '/aperos', '/bibliotheque']) assert.equal((await request(path, 1)).status, 200, path);
 passed('Other administration and public sections still load');
 console.log(`${checks} HTTP workflow checks passed on an isolated production server.`);
} catch (error) {
 console.error(error);
 console.error(serverLog.slice(-1600));
 process.exitCode = 1;
} finally {
 if (server.exitCode === null) {
 const ended = once(server, 'exit');
 server.kill('SIGTERM');
 await Promise.race([ended, new Promise(accept => { const timer = setTimeout(accept, 5000); timer.unref(); })]);
 }
 base.close();
}
