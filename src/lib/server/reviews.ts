import { db, now } from './db.ts';

export class ReviewError extends Error {}
export type Review = {
 publication_id: number; revision: number; author_approved_by: number | null;
 author_approved_at: string | null; reviewer_id: number | null; reviewed_at: string | null;
 requested_by: number | null; requested_id: number | null; request_note: string; priority: number;
};
export function getReview(id: number): Review {
 return db().prepare('select * from article_reviews where publication_id=?').get(id) as Review ?? {
 publication_id:id,revision:1,author_approved_by:null,author_approved_at:null,reviewer_id:null,
 reviewed_at:null,requested_by:null,requested_id:null,request_note:'',priority:0
 };
}
export function reviewLabel(r: Review) {
 return r.requested_id ? 'Troisième avis demandé' : r.reviewer_id ? 'Validé' : r.author_approved_by ? 'À valider' : 'Brouillon';
}
export function canPublishArticle(id: number) {
 const r=getReview(id);
 const p=db().prepare('select coalesce(byline_admin_id,author_id) as author from publications where id=?').get(id) as {author:number|null}|undefined;
 const active=(id:number|null)=>id && db().prepare('select id from admins where id=? and disabled_at is null').get(id);
 return !!(p && r.author_approved_by===p.author && active(r.author_approved_by) && active(r.reviewer_id) && r.reviewer_id!==r.author_approved_by && !r.requested_id);
}
export function reviewHistory(id:number) {
 return db().prepare(`select h.*, a.display_name as name from article_review_history h join admins a on a.id=h.admin_id where publication_id=? order by h.id desc`).all(id) as {id:number;revision:number;name:string;action:string;note:string;created_at:string}[];
}
export function reviewAction(id:number, actor:number, action:string, revision:number, note:string, target:number, priority:number) {
 const base=db();
 base.exec('begin immediate');
 try {
 const p=base.prepare('select kind,coalesce(byline_admin_id,author_id) as author from publications where id=?').get(id) as {kind:string;author:number|null}|undefined;
 if (!p || p.kind!=='article') throw new ReviewError('Article introuvable.');
 if (!base.prepare('select id from admins where id=? and disabled_at is null').get(actor)) throw new ReviewError('Compte indisponible.');
 base.prepare('insert or ignore into article_reviews(publication_id) values (?)').run(id);
 const r=getReview(id);
 if (r.revision!==revision) throw new ReviewError('Le texte a changé. Relisez la nouvelle version avant de valider.');
 if (note.length>2000) throw new ReviewError('Le commentaire est trop long.');
 if (action==='author') {
 if (p.author!==actor) throw new ReviewError("Seul l'auteur peut valider son texte. Choisissez son compte dans le formulaire.");
 base.prepare('update article_reviews set author_approved_by=?,author_approved_at=? where publication_id=?').run(actor,now(),id);
 } else if (action==='approve') {
 if (!r.author_approved_by || actor===p.author || (r.requested_id && actor!==r.requested_id)) throw new ReviewError('La validation doit être donnée par un autre administrateur ou la personne sollicitée.');
 base.prepare('update article_reviews set reviewer_id=?,reviewed_at=?,requested_id=null,requested_by=null,request_note=\'\' where publication_id=?').run(actor,now(),id);
 } else if (action==='request') {
 if (!r.author_approved_by || actor===p.author || r.requested_id) throw new ReviewError('Cette demande nécessite une première validation de l’auteur, sans autre demande en cours.');
 if (!note.trim() || target===actor || target===p.author || !base.prepare('select id from admins where id=? and disabled_at is null').get(target)) throw new ReviewError('Choisissez une troisième personne et précisez votre doute.');
 base.prepare('update article_reviews set requested_by=?,requested_id=?,request_note=?,reviewer_id=null,reviewed_at=null where publication_id=?').run(actor,target,note,id);
 base.prepare("update publications set status='draft',pinned=0,pinned_order=null,pinned_at=null where id=?").run(id);
 } else if (action==='corrections') {
 if (!note.trim()) throw new ReviewError('Précisez les corrections demandées.');
 base.prepare('update article_reviews set revision=revision+1,author_approved_by=null,author_approved_at=null,reviewer_id=null,reviewed_at=null,requested_id=null,requested_by=null,request_note=\'\' where publication_id=?').run(id);
 base.prepare("update publications set status='draft',pinned=0,pinned_order=null,pinned_at=null where id=?").run(id);
 } else if (action==='comment') {
 if (!note.trim()) throw new ReviewError('Écrivez un commentaire.');
 } else if (action==='priority') {
 if (![0,1,2].includes(priority)) throw new ReviewError('Priorité inconnue.');
 base.prepare('update article_reviews set priority=? where publication_id=?').run(priority,id);
 } else throw new ReviewError('Action inconnue.');
 base.prepare('insert into article_review_history(publication_id,revision,admin_id,action,note,created_at) values(?,?,?,?,?,?)').run(id,r.revision,actor,action,note,now());
 base.exec('commit');
 } catch(e) {base.exec('rollback');throw e;}
}
