import type { PageServerLoad } from './$types';
import { listDrawings } from '$lib/server/drawings';
import { presentDrawing } from '$lib/server/present';
export const load: PageServerLoad = async () => ({ drawings: listDrawings().map(presentDrawing) });
