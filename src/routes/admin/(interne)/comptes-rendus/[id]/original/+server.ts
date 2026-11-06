import {error} from '@sveltejs/kit';
import type {RequestHandler} from './$types';
import {getMeetingReport,readMeetingOriginal} from '$lib/server/meeting-reports';
export const GET:RequestHandler=async({locals,params})=>{
 if(!locals.admin?.totpEnabled)error(403,'Accès réservé aux administrateurs.');
 const row=getMeetingReport(Number(params.id));if(!row?.filename)error(404,'Fichier introuvable.');
 let bytes:Buffer;try{bytes=await readMeetingOriginal(row);}catch{error(404,'Fichier introuvable.');}
 return new Response(new Uint8Array(bytes),{headers:{'Content-Type':row.mime,'Content-Length':String(bytes.length),'Content-Disposition':`attachment; filename="compte-rendu-${row.id}.${row.filename.split('.').pop()}"; filename*=UTF-8''${encodeURIComponent(row.original_name).replace(/['()*]/g,char=>'%'+char.charCodeAt(0).toString(16))}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
};
