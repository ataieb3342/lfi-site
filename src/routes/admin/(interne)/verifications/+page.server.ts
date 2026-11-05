import { articleReviewWorkspace } from '$lib/server/reviews';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = ({locals,url}) => {
 const workspace=articleReviewWorkspace(locals.admin!.id);
 return {...workspace,submitted:url.searchParams.get('soumis')==='1',tab:url.searchParams.get('onglet')==='a-verifier'?'a-verifier':'mes-articles'};
};
