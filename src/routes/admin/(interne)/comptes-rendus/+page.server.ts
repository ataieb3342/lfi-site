import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions,PageServerLoad } from './$types';
import { listMeetingReports,readMeetingFields,importMeetingFile,createMeetingReport } from '$lib/server/meeting-reports';
import { presentMeetingSummary } from '$lib/server/present';
import { audit } from '$lib/server/auth';
export const load:PageServerLoad=async({locals,url})=>{
 if(!locals.admin?.totpEnabled)error(403,'Accès réservé aux administrateurs.');
 const search=(url.searchParams.get('q')??'').trim().slice(0,100);
 return {search,reports:listMeetingReports(search).map(presentMeetingSummary)};
};
export const actions:Actions={
 create:async({locals,request})=>{
  if(!locals.admin?.totpEnabled)return fail(403,{error:'Accès réservé aux administrateurs.'});
  let id:number;
  try{
   const form=await request.formData();const fields=readMeetingFields(form);const file=form.get('file');
   const imported=file instanceof File && file.size?await importMeetingFile(file):null;
   if(imported && fields.body)imported.body=fields.body;
   id=await createMeetingReport(fields,imported,locals.admin.id);
  }catch(err){return fail(400,{error:(err as Error).message});}
  audit(locals.admin,'meeting-report.create',String(id),'',locals.ipHash);
  redirect(303,`/admin/comptes-rendus/${id}`);
 }
};
