import { listArticlesForReview, countArticlesAwaitingReview } from '$lib/server/reviews';
export const load = () => ({articles: listArticlesForReview(), pendingCount: countArticlesAwaitingReview()});
