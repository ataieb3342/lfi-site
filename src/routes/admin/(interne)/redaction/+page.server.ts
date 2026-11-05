import { listArticlesForReview } from '$lib/server/reviews';
import { listAdminChoices } from '$lib/server/auth';
export const load = () => ({articles:listArticlesForReview(false),admins:listAdminChoices().map(a=>({id:a.id,name:a.name}))});
