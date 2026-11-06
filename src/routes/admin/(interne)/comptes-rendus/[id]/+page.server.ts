import {error,fail,redirect} from '@sveltejs/kit';
import type {Actions,PageServerLoad} from './$types';
import {getMeetingReport,readMeetingFields,updateMeetingReport,deleteMeetingReport,renderMeetingBody,toggleMeetingTask} from '$lib/server/meeting-reports';
import {presentMeetingReport} from '$lib/server/present';
import {audit} from '$lib/server/auth';
export const load:PageServerLoad=async({locals,params})=>{
 if(!locals.admin?.totpEnabled)error(403,'Accès réservé aux administrateurs.');
 const row=getMeetingReport(Number(params.id));if(!row)error(404,'Compte rendu introuvable.');
 return {report:presentMeetingReport(row),html:renderMeetingBody(row.body)};
};
export const actions:Actions={
 task:async({locals,params,request})=>{
  if(!locals.admin?.totpEnabled)return fail(403,{error:'Accès réservé aux administrateurs.'});
  const id=Number(params.id);const row=getMeetingReport(id);if(!row)error(404,'Compte rendu introuvable.');
  try{
   const form=await request.formData();const checked=String(form.get('checked'));
   if(!['true','false'].includes(checked))throw new Error('État de case invalide.');
   const line=String(form.get('taskLine')??'');if(!/^\d+$/.test(line))throw new Error('Case invalide.');
   updateMeetingReport(id,{title:row.title,date:row.meeting_date,body:toggleMeetingTask(row.body,Number(line),checked==='true')},String(form.get('version')??''));
  }catch(err){return fail(400,{error:(err as Error).message});}
  audit(locals.admin,'meeting-report.task',String(id),'',locals.ipHash);
  return {taskSaved:true};
 },
 save:async({locals,params,request})=>{
  if(!locals.admin?.totpEnabled)return fail(403,{error:'Accès réservé aux administrateurs.'});
  const id=Number(params.id);if(!getMeetingReport(id))error(404,'Compte rendu introuvable.');
  try{const form=await request.formData();updateMeetingReport(id,readMeetingFields(form),String(form.get('version')??''));}
  catch(err){return fail(400,{error:(err as Error).message});}
  audit(locals.admin,'meeting-report.update',String(id),'',locals.ipHash);
  redirect(303,`/admin/comptes-rendus/${id}`);
 },
 delete:async({locals,params})=>{
  if(!locals.admin?.totpEnabled)return fail(403,{error:'Accès réservé aux administrateurs.'});
  const id=Number(params.id);if(!getMeetingReport(id))error(404,'Compte rendu introuvable.');
  await deleteMeetingReport(id);audit(locals.admin,'meeting-report.delete',String(id),'',locals.ipHash);
  redirect(303,'/admin/comptes-rendus');
 }
};
