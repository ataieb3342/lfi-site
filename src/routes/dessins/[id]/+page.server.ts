import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDrawing, listDrawings } from '$lib/server/drawings';
import { presentDrawing } from '$lib/server/present';
export const load: PageServerLoad = async ({ params }) => {
 const drawing = getDrawing(Number(params.id));
 if (!drawing) error(404, 'Dessin introuvable.');
 const drawings = listDrawings();
 const index = drawings.findIndex(item => item.id === drawing.id);
 const neighbour = (position: number) => drawings[position] ? { id: drawings[position].id, title: drawings[position].title } : null;
 return { drawing: presentDrawing(drawing), previous: neighbour(index - 1), next: neighbour(index + 1) };
};
