import assert from 'node:assert/strict';
import { deflateRawSync } from 'node:zlib';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';

const scratch = mkdtempSync(join(tmpdir(), 'lfi-meeting-reports-'));
const origin = 'http://127.0.0.1:5196';
Object.assign(process.env, {
 DATABASE_PATH: join(scratch, 'site.db'), UPLOADS_PATH: join(scratch, 'uploads'),
 BIBLIOTHEQUE_PATH: join(scratch, 'library'), SECRET_KEY: randomBytes(48).toString('base64'),
 MODE_DEMO: '0', NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '5196', ORIGIN: origin
});
const { db } = await import('../../src/lib/server/db.ts');
const { createSession, SESSION_COOKIE } = await import('../../src/lib/server/auth.ts');
const {renderMeetingBody,toggleMeetingTask}=await import('../../src/lib/server/meeting-reports.ts');
const taskSample='- [ ] **Task**\n  - [X] Nested\n\n```\n- [ ] Code\n```\n\n[ ] Plain text';
assert.equal((renderMeetingBody(taskSample).match(/type="checkbox"/g)||[]).length,2);
assert.ok(toggleMeetingTask(taskSample,1,false).includes('  - [ ] Nested'));
assert.throws(()=>toggleMeetingTask(taskSample,4,true));
assert.ok(!renderMeetingBody('- [ ] <script>alert(1)</script>').includes('<script>'));
const base = db();
base.prepare("insert into admins(id,username,display_name,password_hash,role,created_at,totp_confirmed_at) values(1,'drawing-test','Drawing test','unused','admin',?,?)").run(new Date().toISOString(), new Date().toISOString());
const token = createSession(1, 'test', 'isolated drawing integration test');
const server = spawn(process.execPath, ['build/index.js'], { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
let logs = '';
server.stdout.on('data', b => logs += b);
server.stderr.on('data', b => logs += b);
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

 const path='/admin/comptes-rendus';
 assert.equal((await request(path,null,false)).status,303);
 assert.equal((await request(path)).status,200);
 function fields(title='Private meeting',body='') {const f=new FormData();for(const [k,v]of Object.entries({title,meetingDate:'2026-11-06',body}))f.set(k,v);return f;}
 const invalid=fields();invalid.set('file',new File(['not a docx'],'wrong.docx'));
 assert.equal((await request(path+'?/create',invalid)).status,400);
 const md='# Internal decisions\n\nPRIVATE_REPORT_BODY_SENTINEL\n\n- [ ] Task one\n- [X] Task two\n\n<script>alert(1)</script>\n![Secret image](https://example.invalid/tracker.png)';
 const input=fields();input.set('file',new File([md],'report.md'));
 const preview=await request(path+'/import',input);
 assert.equal(preview.status,200);assert.equal(JSON.parse(preview.html).body,md);
 assert.ok(preview.headers.get('cache-control').includes('no-store'));
 assert.equal(base.prepare('select count(*) as n from meeting_reports').get().n,0,'Preview does not save a report');
 assert.equal((await request(path+'/import',input,false)).status,303);
 const saved=await request(path+'?/create',input);
 assert.equal(saved.status,303);
 const row=base.prepare('select * from meeting_reports').get();
 assert.equal(row.body,md);
 const url=path+'/'+row.id;
 const view=await request(url);assert.equal(view.status,200);
 assert.equal((view.html.match(/<input type="checkbox" data-task-line=/g)||[]).length,2);
 assert.ok(view.html.includes('Internal decisions'));assert.ok(!view.html.includes('<script>alert(1)</script>'));
 assert.ok(!view.html.includes('<img src="https://example.invalid/tracker.png"'));
 const toggle=new FormData();toggle.set('taskLine','4');toggle.set('checked','true');toggle.set('version',row.updated_at);
 assert.equal((await request(url+'?/task',toggle)).status,200);
 assert.ok(base.prepare('select body from meeting_reports where id=?').get(row.id).body.includes('- [x] Task one'));
 assert.equal((await request(url+'?/task',toggle)).status,400,'Stale task updates are rejected');
 toggle.set('checked','false');toggle.set('version',base.prepare('select updated_at from meeting_reports where id=?').get(row.id).updated_at);
 assert.equal((await request(url+'?/task',toggle)).status,200);
 row.updated_at=base.prepare('select updated_at from meeting_reports where id=?').get(row.id).updated_at;
 assert.equal(base.prepare('select body from meeting_reports where id=?').get(row.id).body,md);
 const original=await fetch(origin+url+'/original',{headers:{Cookie:`${SESSION_COOKIE}=${token}`}});
 assert.equal(original.status,200);assert.equal(await original.text(),md);
 assert.ok(original.headers.get('content-disposition').startsWith('attachment'));
 assert.ok(view.headers.get('cache-control').includes('no-store'));
 assert.ok(original.headers.get('cache-control').includes('no-store'));
 for(const target of [url,url+'/original'])assert.equal((await request(target,null,false)).status,303);
 for(const target of ['/','/articles','/dessins','/bibliotheque','/rss.xml','/sitemap.xml']){
  for(const authenticated of [false,true]){
   const publicPage=await request(target,null,authenticated);
   for(const secret of ['Private meeting','PRIVATE_REPORT_BODY_SENTINEL',row.filename,'/admin/comptes-rendus'])assert.ok(!publicPage.html.includes(secret),`Private content leaked on ${target}`);
  }
 }
 for(const target of ['/uploads/.meeting-reports/'+row.filename,'/data/uploads/.meeting-reports/'+row.filename,'/media/.meeting-reports/'+row.filename])assert.equal((await request(target,null,false)).status,404);
 for(const target of [path+'/import',path+'?/create',url+'?/save',url+'?/task',url+'?/delete']){
  assert.equal((await request(target,fields('Unauthorized','Blocked'),false)).status,303);
  assert.equal(base.prepare('select count(*) as n from meeting_reports').get().n,1);
  assert.equal(base.prepare('select body from meeting_reports where id=?').get(row.id).body,md);
 }
 const crossSite=await fetch(origin+url+'?/task',{method:'POST',body:toggle,redirect:'manual',headers:{Cookie:`${SESSION_COOKIE}=${token}`,Origin:'https://example.invalid',Accept:'text/html'}});
 assert.equal(crossSite.status,403,'Cross-site changes are blocked');
 assert.equal((await request('/media/'+row.filename,null,false)).status,404);
 assert.ok((await request(path+'?q=decisions')).html.includes('Private meeting'));
 const edited=fields('Updated internal meeting','## Corrected decisions');edited.set('version',row.updated_at);
 assert.equal((await request(url+'?/save',edited)).status,303);
 assert.equal(base.prepare('select body from meeting_reports where id=?').get(row.id).body,'## Corrected decisions');
 assert.equal((await request(url+'?/save',edited)).status,400,'Stale versions are rejected');
 assert.equal(await (await fetch(origin+url+'/original',{headers:{Cookie:`${SESSION_COOKIE}=${token}`}})).text(),md);
 base.prepare("insert into admins(id,username,display_name,password_hash,role,created_at) values(2,'no2fa','No 2FA','unused','admin',?)").run(new Date().toISOString());
 const no2fa=createSession(2,'test','missing 2fa test');
 for(const target of [path,url,url+'/original']){
  const denied=await fetch(origin+target,{redirect:'manual',headers:{Cookie:`${SESSION_COOKIE}=${no2fa}`}});
  assert.ok([303,403].includes(denied.status));
 }
 for(const target of [path+'/import',path+'?/create',url+'?/save',url+'?/task',url+'?/delete']){
  const attempt=await fetch(origin+target,{method:'POST',body:fields('Unauthorized','Blocked edit'),redirect:'manual',headers:{Origin:origin,Accept:'text/html',Cookie:`${SESSION_COOKIE}=${no2fa}`}});
  assert.ok([303,403].includes(attempt.status));
  assert.equal(base.prepare('select count(*) as n from meeting_reports').get().n,1);
  assert.equal(base.prepare('select body from meeting_reports where id=?').get(row.id).body,'## Corrected decisions');
 }
 const docx=minimalZip({
  '[Content_Types].xml':'<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  '_rels/.rels':'<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  'word/document.xml':'<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Word meeting decisions</w:t></w:r></w:p></w:body></w:document>'
 });
 const word=fields('Word import');word.set('file',new File([docx],'meeting.docx'));
 const wordPreview=await request(path+'/import',word);
 assert.equal(wordPreview.status,200);assert.ok(JSON.parse(wordPreview.html).body.includes('Word meeting decisions'));
 assert.equal((await request(path+'?/create',word)).status,303);
 assert.ok(base.prepare('select body from meeting_reports where title=?').get('Word import').body.includes('Word meeting decisions'));
 const correctedImport=fields('Corrected import','## Corrected before saving');correctedImport.set('file',new File([md],'source.md'));
 assert.equal((await request(path+'?/create',correctedImport)).status,303);
 const correctedRow=base.prepare('select * from meeting_reports where title=?').get('Corrected import');
 assert.equal(correctedRow.body,'## Corrected before saving');
 assert.equal(await(await fetch(origin+path+'/'+correctedRow.id+'/original',{headers:{Cookie:`${SESSION_COOKIE}=${token}`}})).text(),md);
 const bomb=minimalZip({'[Content_Types].xml':'x','word/document.xml':'x'.repeat(11*1024*1024)});
 const oversized=fields();oversized.set('file',new File([bomb],'oversized.docx'));
 assert.equal((await request(path+'?/create',oversized)).status,400);
 const removal=new FormData();
 assert.equal((await request(url+'?/delete',removal)).status,303);
 assert.equal((await request(url)).status,404);
 assert.equal((await request(url+'/original')).status,404);
 assert.equal(base.prepare("select count(*) as n from audit_log where action like 'meeting-report.%'").get().n,7);
 console.log('PASS private meeting reports: Markdown and Word imports, archive limits, private download, safe rendering, search, editing, conflict detection, deletion, two-factor authentication and no public disclosure.');

} finally {
 server.kill('SIGTERM');
}

function crc32(buffer){let crc=0xffffffff;for(const byte of buffer){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function minimalZip(files){const local=[],central=[];let offset=0;for(const[name,text]of Object.entries(files)){const filename=Buffer.from(name),data=Buffer.from(text),compressed=deflateRawSync(data),crc=crc32(data);const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(8,8);header.writeUInt32LE(crc,14);header.writeUInt32LE(compressed.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(filename.length,26);local.push(header,filename,compressed);const entry=Buffer.alloc(46);entry.writeUInt32LE(0x02014b50);entry.writeUInt16LE(20,4);entry.writeUInt16LE(20,6);entry.writeUInt16LE(8,10);entry.writeUInt32LE(crc,16);entry.writeUInt32LE(compressed.length,20);entry.writeUInt32LE(data.length,24);entry.writeUInt16LE(filename.length,28);entry.writeUInt32LE(offset,42);central.push(entry,filename);offset+=header.length+filename.length+compressed.length;}const c=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(Object.keys(files).length,8);end.writeUInt16LE(Object.keys(files).length,10);end.writeUInt32LE(c.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...local,c,end]);}
