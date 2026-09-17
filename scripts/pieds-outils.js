/**
 * Écrit le pied de page de chaque outil de la boîte à outils.
 *
 * Les pages d'outil sont du HTML statique servi tel quel : elles ne peuvent
 * rien calculer à l'affichage, et n'ont pas accès à `src/lib/boite-a-outils.ts`.
 * Sans ce script, les liens « et maintenant ? » seraient recopiés onze fois à
 * la main, et se désaccorderaient de la liste au premier outil ajouté.
 *
 * Le pied remplace tout ce qui se trouve entre les deux marqueurs, ou s'insère
 * avant le `</div>` fermant si les marqueurs sont absents. Le reste du fichier
 * n'est jamais touché : on peut retoucher un outil sans crainte.
 *
 *     npm run outils:pieds
 *
 * Aucune dépendance : Node lit le TypeScript lui-même avec
 * `--experimental-strip-types`, comme les scripts de maintenance du site.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const { OUTILS, outilsSuivants, urlOutil } = await import(
	join(racine, 'src/lib/boite-a-outils.ts')
);

const DEBUT = '\t\t<!-- pied : écrit par scripts/pieds-outils.js — ne pas modifier à la main -->';
const FIN = '\t\t<!-- /pied -->';

/** Le HTML n'accepte pas ces trois caractères tels quels dans du texte. */
function echapper(texte) {
	return texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Le pied d'un outil : de quoi enchaîner, et de quoi faire quelque chose de ce
 * qu'on vient de lire. Avant, la page s'arrêtait sur ses sources — on avait
 * fait le calcul, on était convaincu, et on fermait l'onglet.
 */
function pied(outil) {
	const suivants = outilsSuivants(outil.dossier)
		.map(
			(suivant) => `				<li>
					<a href="${urlOutil(suivant)}">
						<span class="suite-titre">${echapper(suivant.titre)}</span>
						<span class="suite-note">${echapper(suivant.description)}</span>
					</a>
				</li>`
		)
		.join('\n');

	return `${DEBUT}
		<nav class="suite" aria-label="Après cet outil">
			<h2>Et maintenant ?</h2>

			<p class="suite-intro">
				Servez-vous-en. Chaque chiffre ci-dessus porte sa source et son année : ce calcul
				tient dans une discussion, un tract ou un fil de commentaires. Et on en parle en
				vrai, un lundi sur deux, autour d’un verre.
			</p>

			<ul class="suite-liste">
${suivants}
			</ul>

			<p class="suite-liens">
				<a href="/boite-a-outils">Tous les outils</a>
				<a href="/aperos">Venir en discuter à un apéro</a>
				<a href="/nous-rejoindre">Rejoindre le groupe</a>
			</p>
		</nav>
${FIN}`;
}

let modifies = 0;

for (const outil of OUTILS) {
	const chemin = join(racine, 'src/lib/boite-a-outils', outil.dossier, 'index.html');
	const avant = readFileSync(chemin, 'utf-8');
	const nouveau = pied(outil);

	let apres;
	const debut = avant.indexOf(DEBUT);
	if (debut !== -1) {
		const fin = avant.indexOf(FIN, debut);
		if (fin === -1) throw new Error(`${outil.dossier} : marqueur d'ouverture sans fermeture`);
		apres = avant.slice(0, debut) + nouveau + avant.slice(fin + FIN.length);
	} else {
		// Le pied se glisse après le contenu de la page, juste avant le `</div>`
		// qui ferme `.page` — donc à la toute fin, avant le chargement du script.
		const ancre = '\t</div>\n';
		const place = avant.lastIndexOf(ancre);
		if (place === -1) throw new Error(`${outil.dossier} : pas de </div> fermant la page`);
		apres = avant.slice(0, place) + nouveau + '\n' + avant.slice(place);
	}

	if (apres !== avant) {
		writeFileSync(chemin, apres);
		modifies += 1;
		console.log(`  ${outil.dossier}`);
	}
}

console.log(
	modifies === 0
		? 'Pieds de page déjà à jour.'
		: `${modifies} pied${modifies > 1 ? 's' : ''} de page mis à jour.`
);
