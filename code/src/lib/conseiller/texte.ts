/**
 * Outils de texte du conseiller (conseiller-ia.md §6.2) : normalisation,
 * mots, phrases, négations. Fonctions pures.
 */

/** Apostrophes typographiques ramenées à « ' ». */
export function apostrophes(texte: string): string {
  return texte.replace(/[’‘ʼ`´]/g, "'");
}

/**
 * Normalisation du validateur : minuscules, accents retirés, apostrophes
 * unifiées, tout ce qui n'est ni lettre ni chiffre devient une espace.
 */
export function normaliser(texte: string): string {
  return apostrophes(texte)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Mots normalisés. */
export function mots(texte: string): string[] {
  const n = normaliser(texte);
  return n === "" ? [] : n.split(" ");
}

/** L'expression normalisée figure-t-elle, en mots entiers, dans le texte normalisé ? */
export function contientExpression(texteNormalise: string, expression: string): boolean {
  return ` ${texteNormalise} `.includes(` ${expression} `);
}

/** Position de l'expression (mots entiers) dans le texte normalisé, ou -1. */
export function positionExpression(texteNormalise: string, expression: string): number {
  const i = ` ${texteNormalise} `.indexOf(` ${expression} `);
  return i;
}

/**
 * Phrases : segments terminés par `.`, `?` ou `…` suivis d'une espace ou de la
 * fin du texte (§6.2, T11). Un texte sans ponctuation finale compte pour une phrase.
 */
export function phrases(texte: string): string[] {
  const t = texte.trim();
  if (t === "") return [];
  return t
    .split(/(?<=[.?…])\s+/u)
    .map((p) => p.trim())
    .filter((p) => p !== "");
}

const NEGATION = /(?<!\p{L})(?:ne|pas|jamais|aucune?|rien)(?!\p{L})|(?<!\p{L})n'/iu;

/** Le texte contient-il une négation (`ne`, `n'`, `pas`, `jamais`, `aucun(e)`, `rien`) ? */
export function contientNegation(texte: string): boolean {
  return NEGATION.test(apostrophes(texte));
}

/** Première négation trouvée, pour les messages. */
export function negationTrouvee(texte: string): string | null {
  return apostrophes(texte).match(NEGATION)?.[0] ?? null;
}

/** Première lettre en minuscule. */
export function minusculeInitiale(texte: string): string {
  return texte.charAt(0).toLocaleLowerCase("fr") + texte.slice(1);
}

/** Première lettre en majuscule. */
export function majusculeInitiale(texte: string): string {
  return texte.charAt(0).toLocaleUpperCase("fr") + texte.slice(1);
}

/** Voyelle initiale (accentuée comprise), pour l'élision. */
export function commenceParVoyelle(texte: string): boolean {
  const premiere = normaliser(texte).charAt(0);
  return "aeiouy".includes(premiere) && premiere !== "";
}

/** Espaces resserrées. */
export function resserrer(texte: string): string {
  return texte.replace(/\s+/g, " ").trim();
}
