/**
 * Accords il / elle et élision du prénom (conception §1, « Notation »).
 *
 * Fonctions pures, sans dépendance au serveur : utilisables dans un composant
 * client comme dans le moteur.
 */
import type { Gabarit, Genre, TexteSelonPrenom } from "./types";

export interface ContexteAccord {
  genre: Genre;
  /** Prénom saisi ; vide ou absent : pas de prénom. */
  prenom?: string | null;
  /** Valeurs des `{variables}` du gabarit (« {n} », « {total} »…). */
  variables?: Readonly<Record<string, string | number>>;
}

const VOYELLES = "aeiou";

/** Lettres sans accents, en minuscules : « Élise » → « elise ». */
function sansAccents(texte: string): string {
  return texte.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/**
 * Le prénom commence-t-il par un son qui fait élider « de » et « que » ?
 * Voyelle, accentuée comprise (« Élise »), ou h (« Hugo ») ; un y suivi d'une
 * voyelle se prononce comme une consonne (« Yanis »), sinon comme une voyelle (« Yves »).
 */
export function eliderDevant(prenom: string): boolean {
  const lettres = sansAccents(prenom.trim());
  const premiere = lettres[0];
  if (premiere === undefined) return false;
  if (VOYELLES.includes(premiere) || premiere === "h") return true;
  if (premiere === "y") {
    const suivante = lettres[1];
    return suivante === undefined || !VOYELLES.includes(suivante);
  }
  return false;
}

/** « de Lucas », « d'Anaïs ». */
export function dePrenom(prenom: string): string {
  const p = prenom.trim();
  return eliderDevant(p) ? `d'${p}` : `de ${p}`;
}

/** « que Lucas », « qu'Anaïs ». */
export function quePrenom(prenom: string): string {
  const p = prenom.trim();
  return eliderDevant(p) ? `qu'${p}` : `que ${p}`;
}

/** Prénom utilisable, ou `null` (vide, espaces). */
export function prenomOuNull(prenom: string | null | undefined): string | null {
  const p = prenom?.trim() ?? "";
  return p === "" ? null : p;
}

const MARQUE = /\{([^{}]*)\}/g;

/**
 * Remplit un gabarit : `{masculin|féminin}`, `{prenom}`, `{de_prenom}`,
 * `{que_prenom}` et les `{variables}`. Lève une erreur sur toute marque
 * inconnue ou sans valeur : un texte à trou ne doit jamais s'afficher.
 */
export function accorder(gabarit: Gabarit, contexte: ContexteAccord): string {
  const prenom = prenomOuNull(contexte.prenom);
  return gabarit.replace(MARQUE, (_marque, interieur: string) => {
    const formes = interieur.split("|");
    if (formes.length === 2) return (contexte.genre === "il" ? formes[0] : formes[1]) ?? "";
    if (formes.length > 2)
      throw new Error(`Marque d'accord à plus de deux formes : {${interieur}}`);
    if (interieur === "prenom" || interieur === "de_prenom" || interieur === "que_prenom") {
      if (prenom === null) throw new Error(`{${interieur}} sans prénom dans « ${gabarit} »`);
      if (interieur === "prenom") return prenom;
      return interieur === "de_prenom" ? dePrenom(prenom) : quePrenom(prenom);
    }
    const valeur = contexte.variables?.[interieur];
    if (valeur === undefined)
      throw new Error(`Variable {${interieur}} sans valeur dans « ${gabarit} »`);
    return String(valeur);
  });
}

/** Choisit la version avec ou sans prénom, puis accorde. */
export function rendreTexte(texte: TexteSelonPrenom, contexte: ContexteAccord): string {
  if (typeof texte === "string") return accorder(texte, contexte);
  const gabarit = prenomOuNull(contexte.prenom) === null ? texte.sansPrenom : texte.avecPrenom;
  return accorder(gabarit, contexte);
}
