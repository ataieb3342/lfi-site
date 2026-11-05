import { articleReviewWorkspace } from '$lib/server/reviews';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = ({locals,url}) => {
 const workspace=articleReviewWorkspace(locals.admin!.id);
 return {...workspace,tab:url.searchParams.get('onglet')==='a-verifier'?'a-verifier':'mes-articles'};
};
