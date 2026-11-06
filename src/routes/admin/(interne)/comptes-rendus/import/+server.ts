import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { importMeetingFile } from '$lib/server/meeting-reports';

export const POST:RequestHandler=async({locals,request})=>{
 if(!locals.admin?.totpEnabled)error(403,'Accès réservé aux administrateurs.');
 try{
  const form=await request.formData();const file=form.get('file');
  if(!(file instanceof File)||!file.size)throw new Error('Choisissez un fichier .docx ou .md.');
  const imported=await importMeetingFile(file);
  return json({body:imported.body});
 }catch(err){return json({error:(err as Error).message},{status:400});}
};
