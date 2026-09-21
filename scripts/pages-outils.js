/**
 * Écrit l'en-tête et le pied de page de chaque outil de la boîte à outils.
 *
 * Les pages d'outil sont du HTML statique servi tel quel : elles ne peuvent
 * rien calculer à l'affichage, et n'ont pas accès à `src/lib/boite-a-outils.ts`.
 * Sans ce script, les liens « et maintenant ? » et les descriptions seraient
 * recopiés onze fois à la main, et se désaccorderaient de la liste au premier
 * outil ajouté.
 *
 * Deux blocs sont écrits, chacun entre ses marqueurs, et rien d'autre dans le
 * fichier n'est touché :
 *
 *  - dans le `<head>`, le titre et la description que Google affiche dans ses
 *    résultats. Ces pages sont les plus susceptibles d'être trouvées par
 *    quelqu'un qui ne connaît pas le groupe — on ne cherche pas « LFI Dijon »,
 *    on cherche « combien d'impôts je paie » — et sans description, le moteur
 *    affiche à la place la première phrase qu'il trouve dans la page ;
 *  - en bas de page, les liens « et maintenant ? ».
 *
 *     npm run outils:pages
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
// Le nom du site est modifiable dans l'administration, mais ces pages sont
// statiques : elles portent celui d'origine. Après un changement de nom, il
// faut relancer ce script.
const { DEFAULTS } = await import(join(racine, 'src/lib/server/settings.ts'));

const DEBUT = '\t\t<!-- pied : écrit par scripts/pages-outils.js — ne pas modifier à la main -->';
const FIN = '\t\t<!-- /pied -->';

const DEBUT_TETE = '\t<!-- tête : écrite par scripts/pages-outils.js — ne pas modifier à la main -->';
const FIN_TETE = '\t<!-- /tête -->';

/** Le HTML n'accepte pas ces trois caractères tels quels dans du texte. */
function echapper(texte) {
	return texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Dans un attribut, le guillemet droit doit l'être aussi. */
function attribut(texte) {
	return echapper(texte).replace(/"/g, '&quot;');
}

/**
 * Le titre et la description de la page.
 *
 * La description est l'`accroche` quand elle existe — c'est la phrase longue,
 * celle qui explique — et la `description` sinon. Écrire une accroche pour
 * chaque outil, et pas seulement pour les deux mis en avant, donne donc aussi
 * une meilleure description dans les résultats de recherche.
 */
function tete(outil) {
	const titre = `${outil.titre} — ${DEFAULTS.site_name}`;
	const resume = outil.accroche ?? outil.description;
	return `${DEBUT_TETE}
	<title>${echapper(titre)}</title>
	<meta name="description" content="${attribut(resume)}">
	<meta property="og:type" content="website">
	<meta property="og:title" content="${attribut(titre)}">
	<meta property="og:description" content="${attribut(resume)}">
	<meta property="og:site_name" content="${attribut(DEFAULTS.site_name)}">
	<meta property="og:locale" content="fr_FR">
${FIN_TETE}`;
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
	let apres = avant;

	// 1. La tête. Au premier passage, elle remplace la ligne `<title>` écrite à
	//    la main ; ensuite, ce qui se trouve entre ses marqueurs.
	const debutTete = apres.indexOf(DEBUT_TETE);
	if (debutTete !== -1) {
		const finTete = apres.indexOf(FIN_TETE, debutTete);
		if (finTete === -1) throw new Error(`${outil.dossier} : marqueur de tête sans fermeture`);
		apres = apres.slice(0, debutTete) + tete(outil) + apres.slice(finTete + FIN_TETE.length);
	} else {
		const ligneTitre = apres.match(/^[ \t]*<title>[\s\S]*?<\/title>[ \t]*$/m);
		if (!ligneTitre) throw new Error(`${outil.dossier} : pas de <title> dans le <head>`);
		apres =
			apres.slice(0, ligneTitre.index) +
			tete(outil) +
			apres.slice(ligneTitre.index + ligneTitre[0].length);
	}

	// 2. Le pied.
	const nouveau = pied(outil);
	const debut = apres.indexOf(DEBUT);
	if (debut !== -1) {
		const fin = apres.indexOf(FIN, debut);
		if (fin === -1) throw new Error(`${outil.dossier} : marqueur d'ouverture sans fermeture`);
		apres = apres.slice(0, debut) + nouveau + apres.slice(fin + FIN.length);
	} else {
		// Le pied se glisse après le contenu de la page, juste avant le `</div>`
		// qui ferme `.page` — donc à la toute fin, avant le chargement du script.
		const ancre = '\t</div>\n';
		const place = apres.lastIndexOf(ancre);
		if (place === -1) throw new Error(`${outil.dossier} : pas de </div> fermant la page`);
		apres = apres.slice(0, place) + nouveau + '\n' + apres.slice(place);
	}

	if (apres !== avant) {
		writeFileSync(chemin, apres);
		modifies += 1;
		console.log(`  ${outil.dossier}`);
	}
}

console.log(
	modifies === 0 ? 'Pages déjà à jour.' : `${modifies} page${modifies > 1 ? 's' : ''} mise${modifies > 1 ? 's' : ''} à jour.`
);
