/**
 * Limite le nombre de requêtes qu'une même adresse peut envoyer au site.
 *
 * Le 16 octobre 2026, environ 80 adresses ont envoyé 75 000 requêtes en dix
 * minutes, presque toutes sur la page d'accueil. Fabriquer une page prend au
 * site quelques dizaines de millisecondes ; refuser une requête, un dixième de
 * milliseconde. Ce module fait donc le tri le plus tôt possible, dans
 * hooks.server.ts, avant toute lecture de la base.
 *
 * Chaque adresse dispose de deux réserves de jetons. Une requête consomme un
 * jeton de chacune ; les réserves se remplissent à vitesse constante. Une
 * adresse peut donc envoyer une rafale (une page et ses images), puis doit
 * ralentir :
 *
 *  - la réserve générale est large, parce qu'une même adresse peut cacher
 *    beaucoup de monde : le Wi-Fi d'un bar pendant un apéro, une salle de
 *    réunion, un opérateur mobile qui partage ses adresses entre abonnés ;
 *  - la réserve par page est étroite : redemander la même page des dizaines de
 *    fois par minute, c'est ce que fait un robot qui inonde le site, jamais un
 *    lecteur. C'est elle qui aurait arrêté l'attaque du 16 octobre.
 *
 * Les compteurs sont en mémoire, et non en base comme ceux de `ratelimit.ts` :
 * il s'agit ici de centaines de requêtes par seconde, et écrire chacune dans
 * SQLite ferait exactement le travail que l'attaquant cherche à imposer. Un
 * redémarrage remet les compteurs à zéro, sans conséquence : les réserves se
 * reconstituent de toute façon en une minute.
 *
 * Ce que ce module ne peut pas faire : arrêter une vague venue de milliers
 * d'adresses qui demandent chacune peu de pages. Le plafond de Caddy
 * (`unhealthy_request_count` dans docker/Caddyfile) prend alors le relais.
 */

type Regle = { capacite: number; parSeconde: number };
type Reserve = { jetons: number; maj: number };

/** 300 requêtes d'affilée, puis 5 par seconde. */
const GENERALE: Regle = { capacite: 300, parSeconde: 5 };

/** 60 fois la même page d'affilée, puis 10 fois par minute. */
const PAR_PAGE: Regle = { capacite: 60, parSeconde: 10 / 60 };

/**
 * Au-delà, on oublie tout plutôt que de laisser la mémoire grossir sans fin.
 * Laisser passer quelques requêtes de trop vaut mieux que faire tomber le site.
 */
const ENTREES_MAX = 100_000;

const generales = new Map<string, Reserve>();
const parPage = new Map<string, Reserve>();

/** Recharge une réserve selon le temps écoulé, et la crée si besoin. */
function recharger(reserves: Map<string, Reserve>, cle: string, regle: Regle, maintenant: number): Reserve {
	const reserve = reserves.get(cle);
	if (!reserve) {
		const nouvelle = { jetons: regle.capacite, maj: maintenant };
		reserves.set(cle, nouvelle);
		return nouvelle;
	}
	const ecoule = (maintenant - reserve.maj) / 1000;
	reserve.jetons = Math.min(regle.capacite, reserve.jetons + ecoule * regle.parSeconde);
	reserve.maj = maintenant;
	return reserve;
}

/**
 * Une adresse IPv6 désigne un appareil, mais un abonné en reçoit des
 * milliards d'un coup (un bloc de 64 bits) : sans regroupement, un attaquant
 * changerait d'adresse à chaque requête. On compte donc par bloc.
 */
export function cleAdresse(adresse: string): string {
	if (!adresse.includes(':')) return adresse;

	const ipv4 = adresse.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
	if (ipv4) return ipv4[1];

	const [tete, queue] = adresse.split('::');
	const debut = tete ? tete.split(':') : [];
	const fin = queue ? queue.split(':') : [];
	const manquants = Math.max(0, 8 - debut.length - fin.length);
	const groupes = [...debut, ...Array(manquants).fill('0'), ...fin];
	return `${groupes.slice(0, 4).join(':').toLowerCase()}::/64`;
}

/**
 * Faut-il servir cette requête ? Ne consomme de jetons que si la réponse est
 * oui : une adresse qui insiste pendant qu'elle est bloquée ne fait que
 * attendre que sa réserve se remplisse.
 */
export function autoriser(adresse: string, chemin: string): boolean {
	if (parPage.size > ENTREES_MAX || generales.size > ENTREES_MAX) {
		console.warn('[limiteur] trop d’adresses suivies à la fois : compteurs remis à zéro');
		parPage.clear();
		generales.clear();
	}
	demarrerMenage();

	const maintenant = Date.now();
	const cle = cleAdresse(adresse);
	const generale = recharger(generales, cle, GENERALE, maintenant);
	const page = recharger(parPage, `${cle} ${chemin.slice(0, 200)}`, PAR_PAGE, maintenant);

	if (generale.jetons < 1 || page.jetons < 1) return false;
	generale.jetons -= 1;
	page.jetons -= 1;
	return true;
}

/** La réponse envoyée à une adresse trop insistante. */
export function reponseTropDeRequetes(): Response {
	return new Response(
		'Trop de requêtes en peu de temps depuis votre connexion. Patientez une minute avant de recharger la page.\n',
		{
			status: 429,
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Retry-After': '60',
				'Cache-Control': 'no-store'
			}
		}
	);
}

/** Nombre d'adresses (ou de blocs IPv6) bloquées en ce moment. */
export function adressesBloquees(): number {
	const maintenant = Date.now();
	const bloquees = new Set<string>();
	const vides = (reserve: Reserve, regle: Regle) =>
		reserve.jetons + ((maintenant - reserve.maj) / 1000) * regle.parSeconde < 1;

	for (const [cle, reserve] of generales) if (vides(reserve, GENERALE)) bloquees.add(cle);
	for (const [cle, reserve] of parPage) if (vides(reserve, PAR_PAGE)) bloquees.add(cle.split(' ')[0]);
	return bloquees.size;
}

/**
 * Une réserve redevenue pleine ne sert plus à rien : l'adresse est traitée
 * comme si on ne l'avait jamais vue. Le ménage se fait toutes les minutes.
 */
function menage() {
	const maintenant = Date.now();
	const oublier = (reserves: Map<string, Reserve>, regle: Regle) => {
		for (const [cle, reserve] of reserves) {
			if (reserve.jetons + ((maintenant - reserve.maj) / 1000) * regle.parSeconde >= regle.capacite) {
				reserves.delete(cle);
			}
		}
	};
	oublier(generales, GENERALE);
	oublier(parPage, PAR_PAGE);
}

let minuterie: ReturnType<typeof setInterval> | null = null;
function demarrerMenage() {
	if (minuterie) return;
	minuterie = setInterval(menage, 60_000);
	minuterie.unref();
}
