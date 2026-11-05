import { db } from '$lib/server/db';
import { getReview, reviewLabel } from '$lib/server/reviews';
export const load = () => ({articles: (db().prepare("select id,title,author_name,status from publications where kind='article' and status='draft'").all() as {id:number;title:string;author_name:string;status:string}[]).map(p=>({...p,review:getReview(p.id),label:reviewLabel(getReview(p.id))})).sort((a,b)=> b.review.priority-a.review.priority || a.id-b.id)});
