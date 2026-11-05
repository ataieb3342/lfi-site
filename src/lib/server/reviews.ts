import { db, now } from './db.ts';
import type { Publication } from './content.ts';

export class ReviewError extends Error {}
export type Review = {
 publication_id: number; revision: number; author_approved_by: number | null;
 author_approved_at: string | null; reviewer_id: number | null; reviewed_at: string | null;
 requested_by: number | null; requested_id: number | null; request_note: string; priority: number;
 advice_requested_id: number | null; advice_requested_by: number | null; advice_note: string; advice_requested_at: string | null;
};
export function getReview(id: number): Review {
 return db().prepare('select * from article_reviews where publication_id=?').get(id) as Review ?? {
 publication_id:id,revision:1,author_approved_by:null,author_approved_at:null,reviewer_id:null,
 reviewed_at:null,requested_by:null,requested_id:null,request_note:'',priority:0,advice_requested_id:null,advice_requested_by:null,advice_note:'',advice_requested_at:null
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
export function reviewAction(id:number, actor:number, action:string, revision:number, note:string, target:number, priority:number, transaction = true) {
 const base=db();
 if (transaction) base.exec('begin immediate');
 try {
 const p=base.prepare('select kind,status,coalesce(byline_admin_id,author_id) as author from publications where id=?').get(id) as {kind:string;status:string;author:number|null}|undefined;
 if (!p || p.kind!=='article') throw new ReviewError('Article introuvable.');
 if (!base.prepare('select id from admins where id=? and disabled_at is null').get(actor)) throw new ReviewError('Compte indisponible.');
 base.prepare('insert or ignore into article_reviews(publication_id) values (?)').run(id);
 const r=getReview(id);
 if (r.revision!==revision) throw new ReviewError('Le texte a changé. Relisez la nouvelle version avant de valider.');
 if (note.length>2000) throw new ReviewError('Le commentaire est trop long.');
 const permissions = articleReviewPermissions(id, actor);
 if (action==='author' && !permissions.canSubmit) throw new ReviewError('Cet article ne peut pas être soumis par ce compte.');
 if (['approve','request','corrections'].includes(action) && !permissions.canReview) throw new ReviewError('Cette relecture est réservée à un autre administrateur ou à la personne sollicitée.');
 if (action==='advice' && !permissions.canAskAdvice) throw new ReviewError('Seul l’auteur peut demander un avis sur son brouillon.');
 if (action==='comment' && !permissions.canComment) throw new ReviewError('Vous ne participez pas à cette relecture.');
 if (action==='priority' && !permissions.canEdit) throw new ReviewError('Cet article est en consultation seule pour votre compte.');
 if (action==='author') {
 if (p.author!==actor) throw new ReviewError("Seul l'auteur peut valider son texte. Choisissez son compte dans le formulaire.");
 base.prepare("update article_reviews set author_approved_by=?,author_approved_at=?,advice_requested_id=null,advice_requested_by=null,advice_note='',advice_requested_at=null where publication_id=?").run(actor,now(),id);
 } else if (action==='advice') {
 if (p.status!=='draft' || r.author_approved_by) throw new ReviewError('Cette demande est réservée aux brouillons non soumis.');
 if (!note.trim() || target===actor || !base.prepare('select id from admins where id=? and disabled_at is null').get(target)) throw new ReviewError('Choisissez une autre personne et précisez votre question.');
 if (r.advice_requested_id) throw new ReviewError('Une demande d’avis est déjà en cours.');
 base.prepare('update article_reviews set advice_requested_id=?,advice_requested_by=?,advice_note=?,advice_requested_at=? where publication_id=?').run(target,actor,note,now(),id);
 } else if (action==='advice_reply') {
 if (r.advice_requested_id!==actor || !note.trim()) throw new ReviewError('La personne sollicitée doit écrire son avis.');
 base.prepare("update article_reviews set advice_requested_id=null,advice_requested_by=null,advice_note='',advice_requested_at=null where publication_id=?").run(id);
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
 if (transaction) base.exec('commit');
 } catch(e) {if (transaction) base.exec('rollback');throw e;}
}

export function listArticlesForReview(submitted = true) {
 const rows = db().prepare(`select p.id,p.title,p.author_name,p.created_at,p.status
 from publications p join article_reviews r on r.publication_id=p.id
 where p.kind='article' and p.status='draft'
 and (r.author_approved_by is not null) = ?
 order by r.priority desc,coalesce(r.author_approved_at,p.created_at),p.id`).all(submitted ? 1 : 0) as {id:number;title:string;author_name:string;created_at:string;status:string}[];
 return rows.map(p => ({...p,review:getReview(p.id),label:reviewLabel(getReview(p.id))}));
}

export function countArticlesAwaitingReview(actorId?: number): number {
 if (actorId !== undefined) return Number((db().prepare(`select count(*) as n from publications p
 join article_reviews r on r.publication_id=p.id
 where p.kind='article' and p.status='draft'
 and coalesce(p.byline_admin_id,p.author_id) is not ?
 and exists(select 1 from admins where id=? and disabled_at is null)
 and ((r.author_approved_by is not null and r.reviewer_id is null and (r.requested_id is null or r.requested_id=?))
 or (r.author_approved_by is null and r.advice_requested_id=?))`).get(actorId,actorId,actorId,actorId) as {n:number}).n);
 return Number((db().prepare(`select count(*) as n from publications p
 join article_reviews r on r.publication_id=p.id
 where p.kind='article' and p.status='draft' and r.author_approved_by is not null
 and (r.reviewer_id is null or r.requested_id is not null)`).get() as {n:number}).n);
}

export function articleReviewPermissions(id: number, actorId: number) {
 const p = db().prepare('select * from publications where id=?').get(id) as Publication | undefined;
 if (!p || p.kind !== 'article') return {isAuthor:false,canEdit:true,canSubmit:false,canReview:false,canAskAdvice:false,canReplyAdvice:false,canComment:false,canPublish:false};
 const r = getReview(id);
 const isAuthor = (p.byline_admin_id ?? p.author_id) === actorId;
 const active = !!db().prepare('select id from admins where id=? and disabled_at is null').get(actorId);
 const canReview = active && !isAuthor && p.status === 'draft' && !!r.author_approved_by && (!r.reviewer_id || r.reviewer_id===actorId) && (!r.requested_id || r.requested_id === actorId);
 const canSubmit = active && isAuthor && p.status === 'draft' && !r.author_approved_by;
 return {isAuthor,canEdit:active && (p.status === 'published' || canSubmit || canReview),canSubmit,canReview,
 canAskAdvice:canSubmit,canReplyAdvice:active && !isAuthor && r.advice_requested_id === actorId && !r.author_approved_by,
 canComment:active && (p.status==='published' || isAuthor || canReview || r.advice_requested_id === actorId || r.reviewer_id === actorId || r.requested_by === actorId),
 canPublish:active && isAuthor && p.status === 'draft' && canPublishArticle(id)};
}

export function assertArticleEditable(id: number, actorId: number) {
 if (!articleReviewPermissions(id,actorId).canEdit) throw new ReviewError('Cet article est en cours de relecture. Vous pouvez consulter le texte et les commentaires.');
}

export function publishReviewedArticle(id:number, actorId:number, revision:number) {
 const base=db();
 base.exec('begin immediate');
 try {
 if (getReview(id).revision!==revision || !articleReviewPermissions(id,actorId).canPublish) throw new ReviewError('Seul l’auteur peut publier la version validée de cet article.');
 base.prepare("update publications set status='published',published_at=coalesce(published_at,?),updated_at=? where id=?").run(now(),now(),id);
 base.exec('commit');
 } catch(e) {base.exec('rollback');throw e;}
}

export function articleReviewWorkspace(actorId:number) {
 const rows=db().prepare(`select p.id,p.title,p.author_name,p.status,p.updated_at,
 coalesce(p.byline_admin_id,p.author_id) as owner from publications p
 where p.kind='article' and p.status='draft' order by p.updated_at desc,p.id desc`).all() as {id:number;title:string;author_name:string;status:string;updated_at:string;owner:number|null}[];
 const articles=rows.map(p=>{
 const review=getReview(p.id);
 const history=reviewHistory(p.id);
 const lastRemark=history.find(h=>['comment','corrections','advice_reply'].includes(h.action));
 const needsCorrections=!review.author_approved_by && history.find(h=>['author','corrections'].includes(h.action))?.action==='corrections';
 return {...p,review,permissions:articleReviewPermissions(p.id,actorId),lastRemark:lastRemark?.note ?? '',
 label:needsCorrections ? 'Corrections demandées' : review.reviewer_id ? 'Prêt à publier' : review.requested_id ? 'Avis en cours' : review.author_approved_by ? 'En attente de relecture' : 'En rédaction'};
 });
 return {mine:articles.filter(p=>p.owner===actorId),toReview:articles.filter(p=>p.owner!==actorId && ((p.permissions.canReview && !p.review.reviewer_id) || p.permissions.canReplyAdvice)).sort((a,b)=>b.review.priority-a.review.priority || (a.review.author_approved_at ?? a.updated_at).localeCompare(b.review.author_approved_at ?? b.updated_at))};
}
