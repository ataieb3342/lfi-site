import { mkdir, writeFile, unlink, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fromBuffer, type Entry } from 'yauzl';
import mammoth from 'mammoth';
import TurndownService from 'turndown';
import { db, now } from './db.ts';
import { UPLOADS_DIR } from './media.ts';

const directory = join(UPLOADS_DIR, '.meeting-reports');
const MAX_BODY = 200_000;
export type MeetingReport = { id: number; title: string; meeting_date: string; body: string; filename: string | null; original_name: string; mime: string; created_at: string; updated_at: string; created_by: number | null };
export function listMeetingReports(search = '') {
 const pattern = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
 return db().prepare("select id,title,meeting_date,updated_at from meeting_reports where title like ? escape '\\' or body like ? escape '\\' order by meeting_date desc,id desc limit 200").all(pattern, pattern) as Pick<MeetingReport, 'id'|'title'|'meeting_date'|'updated_at'>[];
}
export function getMeetingReport(id: number) {
 if (!Number.isSafeInteger(id) || id <= 0) return undefined;
 return db().prepare('select * from meeting_reports where id=?').get(id) as MeetingReport | undefined;
}
export function readMeetingFields(form: FormData) {
 const title=String(form.get('title') ?? '').trim();
 const date=String(form.get('meetingDate') ?? '');
 const body=String(form.get('body') ?? '').trim();
 if (!title || title.length>200) throw new Error('Indiquez un titre de 200 caractères maximum.');
 if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date) throw new Error('Indiquez une date de réunion valide.');
 if (body.length>MAX_BODY) throw new Error('Le texte dépasse 200 000 caractères.');
 return { title, date, body };
}
async function verifyDocx(bytes: Buffer) {
 await new Promise<void>((resolve,reject)=>{
  fromBuffer(bytes,{lazyEntries:true,validateEntrySizes:true},(error,zip)=>{
   if(error || !zip) return reject(new Error('Document Word illisible. Utilisez un fichier .docx.'));
   let count=0,total=0,actual=0;const names=new Set<string>();let failed=false;
   const stop=(err:Error)=>{if(!failed){failed=true;zip.close();reject(err);}};
   zip.on('error',stop);
   zip.on('entry',(entry:Entry)=>{
    if(++count>1000 || entry.uncompressedSize>10*1024*1024 || (total+=entry.uncompressedSize)>25*1024*1024 || (entry.generalPurposeBitFlag&1) || /vbaProject\.bin$/i.test(entry.fileName)) return stop(new Error('Document Word trop volumineux ou format non pris en charge.'));
    names.add(entry.fileName);
    if(entry.fileName.endsWith('/')) return zip.readEntry();
    zip.openReadStream(entry,(err,stream)=>{
     if(err || !stream) return stop(err ?? new Error('Archive illisible.'));
     stream.on('error',stop);
     stream.on('data',(chunk:Buffer)=>{actual+=chunk.length;if(actual>25*1024*1024){stream.destroy();stop(new Error('Document Word trop volumineux.'));}});
     stream.on('end',()=>{if(!failed)zip.readEntry();});
    });
   });
   zip.on('end',()=>{if(failed)return;if(!names.has('[Content_Types].xml')||!names.has('word/document.xml'))return stop(new Error('Ce fichier n’est pas un document Word .docx.'));resolve();});
   zip.readEntry();
  });
 });
}
export async function importMeetingFile(file: File) {
 const bytes=Buffer.from(await file.arrayBuffer());
 if(!bytes.length || bytes.length>10*1024*1024) throw new Error('Choisissez un fichier de 10 Mo maximum.');
 const name=file.name.replace(/[\\/\x00-\x1f\x7f]/g,'').slice(0,180);
 const extension=name.toLowerCase().split('.').pop();
 let body:string;let mime:string;
 if(extension==='md'||extension==='markdown') {
  if(bytes.length>1024*1024) throw new Error('Le fichier Markdown dépasse 1 Mo.');
  try {body=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new Error('Le fichier Markdown doit être encodé en UTF-8.');}
  if(body.includes('\0')) throw new Error('Ce fichier ne contient pas du texte Markdown.');
  mime='text/markdown; charset=utf-8';
 } else if(extension==='docx') {
  await verifyDocx(bytes);
  const result=await mammoth.convertToHtml({buffer:bytes},{externalFileAccess:false,convertImage:mammoth.images.imgElement(async()=>({src:''}))});
  const converter=new TurndownService({headingStyle:'atx',bulletListMarker:'-'});
  converter.remove('img');
  body=converter.turndown(result.value);mime='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
 } else throw new Error('Formats acceptés : .docx ou .md.');
 body=body.trim();
 if(!body || body.length>MAX_BODY) throw new Error('Le document est vide ou dépasse 200 000 caractères de texte.');
 return { bytes, body, mime, name, extension };
}
export async function createMeetingReport(fields:ReturnType<typeof readMeetingFields>, imported:Awaited<ReturnType<typeof importMeetingFile>>|null,adminId:number) {
 const body=imported?.body ?? fields.body;
 if(!body)throw new Error('Importez un document ou saisissez le compte rendu.');
 const filename=imported?`${randomUUID()}.${imported.extension}`:null;
 if(filename && imported){await mkdir(directory,{recursive:true});await writeFile(join(directory,filename),imported.bytes,{flag:'wx',mode:0o600});}
 try {const date=now();return Number(db().prepare('insert into meeting_reports(title,meeting_date,body,filename,original_name,mime,created_at,updated_at,created_by) values(?,?,?,?,?,?,?,?,?)').run(fields.title,fields.date,body,filename,imported?.name ?? '',imported?.mime ?? '',date,date,adminId).lastInsertRowid);}
 catch(error){if(filename)await unlink(join(directory,filename)).catch(()=>{});throw error;}
}
export function updateMeetingReport(id:number,fields:ReturnType<typeof readMeetingFields>,expectedVersion:string) {
 if(!fields.body)throw new Error('Le compte rendu ne peut pas être vide.');
 const timestamp=new Date(Math.max(Date.now(),Date.parse(expectedVersion)+1)).toISOString();
 const result=db().prepare('update meeting_reports set title=?,meeting_date=?,body=?,updated_at=? where id=? and updated_at=?').run(fields.title,fields.date,fields.body,timestamp,id,expectedVersion);
 if(!result.changes)throw new Error('Ce compte rendu a été modifié par une autre personne. Rechargez la page avant de recommencer.');
}
export async function deleteMeetingReport(id:number) {
 const report=getMeetingReport(id);if(!report)throw new Error('Compte rendu introuvable.');
 db().prepare('delete from meeting_reports where id=?').run(id);
 if(report.filename)await unlink(join(directory,report.filename)).catch(()=>{});
}
export function readMeetingOriginal(report:MeetingReport) {
 if(!report.filename)throw new Error('Fichier introuvable.');
 return readFile(join(directory,report.filename));
}
export { renderMeetingBody, toggleMeetingTask } from '../meeting-markdown.ts';
