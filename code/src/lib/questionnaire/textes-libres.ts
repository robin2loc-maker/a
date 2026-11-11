/**
 * Phrases libres du questionnaire (Q5, Q6, Q20) : ce qui se passe avant
 * qu'un texte écrit par le parent quitte le navigateur
 * (docs/conception/questions-ouvertes.md §3).
 *
 * - `normaliserReponseLibre` : espaces, longueur, non-réponses ramenées à vide (§3.4) ;
 * - `detecterSante` : repérage d'un terme de santé, de trouble ou de handicap (§3.2) ;
 * - `retirerPassagesSante` : retrait des segments qui en contiennent un (§3.3) ;
 * - `preparerReponseLibre` : les trois, dans l'ordre, pour un champ ;
 * - `nettoyerTextesLibres` : la même chose pour toutes les réponses.
 *
 * Fonctions pures, sans dépendance au serveur : elles tournent dans le
 * navigateur avant toute sauvegarde, puis à nouveau côté serveur (le schéma
 * des réponses les applique). Les listes ne sont pas des textes visibles :
 * elles vivent ici, pas dans content/.
 *
 * Le nettoyage des données identifiantes (prénom, email, téléphone) reste
 * celui du conseiller, au moment de l'envoi au LLM.
 */
import { champsParCle } from "./definition";
import type { Reponses } from "./reponses";

/** Longueur maximale d'une phrase libre (questions ouvertes §2.4). */
export const LONGUEUR_MAX_REPONSE_LIBRE = 140;

/** Minuscules, accents retirés, tout ce qui n'est ni lettre ni chiffre remplacé par une espace. */
export function normaliserPourComparer(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Réponses sans contenu (§3.4)
// ---------------------------------------------------------------------------

/** Réponses sans contenu, sous leur forme normalisée. */
export const NON_REPONSES: readonly string[] = [
  "je ne sais pas",
  "ne sais pas",
  "sais pas",
  "je sais pas",
  "jsp",
  "nsp",
  "aucune idee",
  "pas d idee",
  "rien",
  "rien de special",
  "rien de particulier",
  "pas grand chose",
  "non",
  "ras",
  "idem",
  "pareil",
  "voir au dessus",
  "x",
];

const ENSEMBLE_NON_REPONSES = new Set(NON_REPONSES);

/** En dessous de 3 lettres, une réponse ne dit rien (« ? », « ok », « - »). */
const LETTRES_MIN = 3;

/**
 * Espaces en trop retirés, `longueurMax` caractères au plus ; une réponse
 * sans contenu (vide, moins de 3 lettres, ou dans `NON_REPONSES`) devient "".
 */
export function normaliserReponseLibre(
  texte: string,
  longueurMax: number = LONGUEUR_MAX_REPONSE_LIBRE,
): string {
  const propre = texte.replace(/\s+/g, " ").trim().slice(0, longueurMax).trim();
  const compare = normaliserPourComparer(propre);
  const lettres = compare.replace(/[^a-z]/g, "").length;
  if (lettres < LETTRES_MIN || ENSEMBLE_NON_REPONSES.has(compare)) return "";
  return propre;
}

// ---------------------------------------------------------------------------
// Santé, troubles, handicap (§3.2)
// ---------------------------------------------------------------------------

/**
 * Termes repérés, écrits sous forme normalisée. Un terme est une suite de mots :
 * - un mot terminé par `…` est un préfixe (« dys… » reconnaît « dyslexie ») ;
 * - un autre mot est entier, et reconnaît aussi son pluriel : `s` final, ou
 *   `x` après « au » et « eu » (règle du français ; aucun mot de la liste ne
 *   la demande aujourd'hui, mais elle évite qu'un sigle comme « pai »
 *   reconnaisse « paix »).
 *
 * Liste de la conception, version 2. Retirés exprès : « hopita… » (« son stage
 * de 3ᵉ à l'hôpital ») et « medicament… », qui sont des signaux d'orientation.
 */
export const TERMES_SANTE: readonly string[] = [
  // Troubles de l'apprentissage et du développement
  "dys…",
  "tdah",
  "tda",
  "hyperacti…",
  "autis…",
  "asperger",
  "tsa",
  "toc",
  "trisomi…",
  "trouble de l attention",
  "trouble du comportement",
  "trouble alimentaire",
  "trouble anxieux",
  // Haut potentiel : le résultat d'un bilan psychologique
  "hpi",
  "haut potentiel",
  "surdou…",
  // Handicap et dispositifs
  "handicap…",
  "mdph",
  "aesh",
  "avs",
  "pap",
  "pps",
  "pai",
  "ulis",
  "ime",
  "sessad",
  "fauteuil roulant",
  "sourd…",
  "malentendant…",
  "malvoyant…",
  "aveugle",
  // Maladies et soins
  "maladie",
  "malade",
  "diabet…",
  "epilep…",
  "asthm…",
  "cancer",
  "leucemie",
  "traitement medical",
  "ritaline",
  "hospitalis…",
  // Santé mentale et suivi
  "depress…",
  "deprim…",
  "anxi…",
  "angoiss…",
  "phobi…",
  "psy",
  "psychiatr…",
  "pedopsy…",
  "psychologue",
  "orthophon…",
  "psychomotric…",
  "ergotherap…",
  "anorex…",
  "boulimi…",
  "scarif…",
  "suicid…",
];

type MotCherche = { prefixe: boolean; mot: string };

const TERMES: readonly MotCherche[][] = TERMES_SANTE.map((terme) =>
  terme
    .split(" ")
    .map((mot) =>
      mot.endsWith("…") ? { prefixe: true, mot: mot.slice(0, -1) } : { prefixe: false, mot },
    ),
);

function motReconnu(cherche: MotCherche, mot: string): boolean {
  if (cherche.prefixe) return mot.startsWith(cherche.mot);
  if (mot === cherche.mot || mot === `${cherche.mot}s`) return true;
  return /(au|eu)$/.test(cherche.mot) && mot === `${cherche.mot}x`;
}

/** Premier terme de santé trouvé dans le texte (forme de la liste), ou `null`. */
export function termeSante(texte: string): string | null {
  const mots = normaliserPourComparer(texte).split(" ");
  for (const [i, terme] of TERMES.entries()) {
    for (let debut = 0; debut + terme.length <= mots.length; debut++) {
      if (terme.every((cherche, k) => motReconnu(cherche, mots[debut + k] ?? ""))) {
        return TERMES_SANTE[i] ?? null;
      }
    }
  }
  return null;
}

/** Le texte contient-il un terme de santé, de trouble ou de handicap ? */
export function detecterSante(texte: string): boolean {
  return termeSante(texte) !== null;
}

// ---------------------------------------------------------------------------
// Retrait (§3.3)
// ---------------------------------------------------------------------------

/** Segments : jusqu'à un `.`, `!`, `?`, `;` ou un retour à la ligne, séparateurs compris. */
const SEGMENT = /[^.!?;\n]+[.!?;\n]*|[.!?;\n]+/g;

/**
 * Retire chaque segment qui contient un terme de santé ; ce qui reste est
 * gardé tel quel. « Il démonte des scooters. Malgré sa dyslexie, il lit. »
 * → « Il démonte des scooters. »
 */
export function retirerPassagesSante(texte: string): string {
  const segments = texte.match(SEGMENT) ?? [];
  return segments
    .filter((segment) => !detecterSante(segment))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Ce qui est enregistré pour une phrase libre : normalisée, sans passage de
 * santé, puis normalisée à nouveau (« Rien. Sa dyslexie. » → "").
 */
export function preparerReponseLibre(
  texte: string,
  longueurMax: number = LONGUEUR_MAX_REPONSE_LIBRE,
): string {
  return normaliserReponseLibre(
    retirerPassagesSante(normaliserReponseLibre(texte, longueurMax)),
    longueurMax,
  );
}

/** Clés des phrases libres : les champs `texte` du questionnaire, hors `prenom`. */
export const CLES_TEXTES_LIBRES: ReadonlyMap<string, number> = (() => {
  const cles = new Map<string, number>();
  for (const [cle, { champs }] of champsParCle()) {
    for (const champ of champs) {
      if (champ.type === "texte" && cle !== "prenom") cles.set(cle, champ.longueurMax);
    }
  }
  return cles;
})();

/**
 * Applique `preparerReponseLibre` à chaque phrase libre des réponses ; une
 * phrase ramenée à vide est retirée. Les autres clés ne changent pas.
 */
export function nettoyerTextesLibres(reponses: Reponses): Reponses {
  const nettoyees: Reponses = { ...reponses, passees: [...reponses.passees] };
  for (const [cle, longueurMax] of CLES_TEXTES_LIBRES) {
    const valeur = nettoyees[cle];
    if (typeof valeur !== "string") continue;
    const texte = preparerReponseLibre(valeur, longueurMax);
    if (texte === "") delete nettoyees[cle];
    else nettoyees[cle] = texte;
  }
  return nettoyees;
}
