import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
process.env.DATABASE_PATH = join(mkdtempSync(join(tmpdir(), 'lfi-review-')), 'test.db');
const { db } = await import('../src/lib/server/db.ts');
const { createPublication, updatePublication, getById, getPublishedBySlug } = await import('../src/lib/server/content.ts');
const { reviewAction, getReview, canPublishArticle, reviewHistory } = await import('../src/lib/server/reviews.ts');
const base = db();
for (let i = 1; i <= 4; i++) {
 base.prepare("insert into admins(username,display_name,password_hash,role,created_at) values(?,?,?,'admin',?)")
 .run(`admin${i}`, `Admin ${i}`, 'unused', new Date().toISOString());
}
const input = { kind: 'article' as const, title: 'Review example', summary: 'Summary', body: 'Version one',
 status: 'draft' as const, commentsOpen: true, coverMediaId: null, authorName: 'Admin 1', authorAdminId: 1,
 eventAt: null, eventCategory: 'autre' as const };
const create = () => createPublication(input, 1);
const act = (id: number, actor: number, action: string, note = '', target = 0, priority = 0) =>
 reviewAction(id, actor, action, getReview(id).revision, note, target, priority);
const publish = (id: number, fields = input) => updatePublication(id, { ...fields, status: 'published' }, { reslug: false });
const approve = (id: number) => { act(id, 1, 'author'); act(id, 2, 'approve'); };

test('requires two distinct administrators and keeps drafts off the public site', () => {
 assert.throws(() => createPublication({ ...input, status: 'published' }, 1));
 const id = create();
 assert.equal(getPublishedBySlug(getById(id)!.slug), undefined);
 assert.throws(() => publish(id));
 assert.throws(() => act(id, 2, 'author'));
 assert.throws(() => act(id, 2, 'approve'));
 act(id, 1, 'author');
 assert.throws(() => act(id, 1, 'approve'));
 assert.throws(() => publish(id));
 act(id, 2, 'approve');
 assert.equal(getById(id)!.status, 'draft'); // Approval does not publish.
 publish(id);
 assert.equal(getPublishedBySlug(getById(id)!.slug)!.id, id);
});

test('reviewer can edit, save and approve without another author agreement', () => {
 const id = create();
 act(id, 1, 'author');
 updatePublication(id, { ...input, body: 'Corrected text' }, { reslug: false });
 assert.equal(getReview(id).revision, 2);
 assert.equal(getReview(id).author_approved_by, 1);
 act(id, 2, 'approve');
 publish(id, { ...input, body: 'Corrected text' });
 assert.equal(getById(id)!.status, 'published');
});

test('a comment alone preserves article, approvals, pending opinion and priority', () => {
 const id = create();
 approve(id);
 act(id, 2, 'priority', '', 0, 2);
 publish(id);
 const before = getById(id);
 const review = getReview(id);
 act(id, 3, 'comment', 'A useful comment');
 assert.deepEqual(getById(id), before);
 assert.deepEqual(getReview(id), review);
 assert.equal(reviewHistory(id)[0].note, 'A useful comment');
 const pending = create();
 act(pending, 1, 'author');
 act(pending, 2, 'request', 'Check the figure', 3);
 const pendingReview = getReview(pending);
 act(pending, 1, 'comment', 'Here is the source');
 assert.deepEqual(getReview(pending), pendingReview);
 assert.equal(canPublishArticle(pending), false);
});

test('third opinion blocks publication until the designated person approves', () => {
 const id = create();
 act(id, 1, 'author');
 for (const target of [0, 1, 2, 999]) assert.throws(() => act(id, 2, 'request', 'Check', target));
 assert.throws(() => act(id, 2, 'request', '', 3));
 act(id, 2, 'request', 'Check the figure', 3);
 assert.throws(() => act(id, 2, 'approve'));
 assert.throws(() => act(id, 4, 'approve'));
 assert.throws(() => publish(id));
 updatePublication(id, { ...input, body: 'More precise wording' }, { reslug: false });
 assert.equal(getReview(id).requested_id, 3);
 act(id, 3, 'approve', 'Checked');
 assert.equal(canPublishArticle(id), true);
 assert.equal(getReview(id).requested_id, null);
});

test('edits invalidate reviewer approval, prevent stale decisions and remove front-page pinning', () => {
 const id = create();
 approve(id);
 publish(id);
 base.prepare('update publications set pinned=1,pinned_order=1,pinned_at=? where id=?').run(new Date().toISOString(), id);
 updatePublication(id, { ...input, status: 'published', body: 'Version two' }, { reslug: false });
 assert.equal(getById(id)!.status, 'draft');
 assert.equal(getById(id)!.pinned, 0);
 assert.equal(getReview(id).author_approved_by, 1);
 assert.equal(getReview(id).reviewer_id, null);
 assert.throws(() => reviewAction(id, 2, 'approve', 1, '', 0, 0));
 const initial = create();
 updatePublication(initial, { ...input, title: 'Changed before first agreement' }, { reslug: false });
 assert.throws(() => reviewAction(initial, 1, 'author', 1, '', 0, 0));
});

test('changing authors resets their agreement', () => {
 const id = create();
 approve(id);
 updatePublication(id, { ...input, authorAdminId: 3, authorName: 'Admin 3' }, { reslug: false });
 assert.equal(getReview(id).author_approved_by, null);
 assert.equal(getReview(id).reviewer_id, null);
 assert.throws(() => act(id, 1, 'author'));
 act(id, 3, 'author');
 act(id, 2, 'approve');
 assert.equal(canPublishArticle(id), true);
});

test('invalid operations roll back completely and corrections block publishing', () => {
 const id = create();
 approve(id);
 const review = getReview(id);
 for (const [action, note, priority] of [['comment', '', 0], ['comment', 'x'.repeat(2001), 0], ['corrections', '', 0], ['priority', '', 3], ['invalid', '', 0]] as const) {
 assert.throws(() => act(id, 3, action, note, 0, priority));
 assert.deepEqual(getReview(id), review);
 }
 act(id, 3, 'corrections', 'Incorrect source');
 assert.equal(canPublishArticle(id), false);
 assert.throws(() => publish(id));
});

test('disabled accounts cannot act or supply a publishing approval', () => {
 const id = create();
 approve(id);
 base.prepare('update admins set disabled_at=? where id=2').run(new Date().toISOString());
 assert.equal(canPublishArticle(id), false);
 assert.throws(() => publish(id));
 assert.throws(() => act(id, 2, 'comment', 'Hello'));
 base.prepare('update admins set disabled_at=null where id=2').run();
 assert.equal(canPublishArticle(id), true);
});

test('events retain their existing publication flow', () => {
 const id = createPublication({ ...input, kind: 'actu', status: 'published', eventAt: '2026-12-01' }, 1);
 assert.equal(getById(id)!.status, 'published');
 assert.throws(() => act(id, 1, 'author'));
});

test('migration preserves articles already published before reviews existed', async () => {
 const { DatabaseSync } = await import('node:sqlite');
 const { spawnSync } = await import('node:child_process');
 const legacyPath = join(mkdtempSync(join(tmpdir(), 'lfi-legacy-')), 'legacy.db');
 base.exec(`vacuum into '${legacyPath.replaceAll("'", "''")}'`);
 const legacy = new DatabaseSync(legacyPath);
 for (const name of ['article_review_create', 'article_review_convert', 'article_review_reset']) legacy.exec(`drop trigger ${name}`);
 legacy.exec('drop table article_review_history; drop table article_reviews; pragma user_version=21');
 const id = Number(legacy.prepare("insert into publications(kind,slug,title,summary,body,status,created_at,updated_at,author_id,author_name,pinned,pinned_order) values('article','legacy-published','Legacy title','Legacy summary','Legacy body','published',?, ?,1,'Admin 1',1,1)").run(new Date().toISOString(), new Date().toISOString()).lastInsertRowid);
 legacy.close();
 const result = spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', "const {db}=await import('./src/lib/server/db.ts'); db().close();"], { env: { ...process.env, DATABASE_PATH: legacyPath }, encoding: 'utf8' });
 assert.equal(result.status, 0, result.stderr);
 const migrated = new DatabaseSync(legacyPath);
 assert.equal(migrated.prepare('select status,body,pinned from publications where id=?').get(id)!.status, 'published');
 assert.equal(migrated.prepare('select body from publications where id=?').get(id)!.body, 'Legacy body');
 assert.equal(migrated.prepare('select pinned from publications where id=?').get(id)!.pinned, 1);
 assert.equal(migrated.prepare('select author_approved_by from article_reviews where publication_id=?').get(id)!.author_approved_by, null);
 assert.deepEqual(migrated.prepare('pragma foreign_key_check').all(), []);
 migrated.close();
});
