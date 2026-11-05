import { listArticlesForReview } from '$lib/server/reviews';
export const load = () => ({articles: listArticlesForReview()});
