/**
 * Composition des textes par le code (conseiller-ia.md §6.5, §7.3.1) : le LLM
 * rend des liens structurés, le code écrit « Vous avez dit qu'… : … ».
 */
import type { Genre } from "@/lib/questionnaire/types";
import { H_MUETS } from "./lexiques";
import { commenceParVoyelle, majusculeInitiale, mots } from "./texte";
import type { LienEnfant, LienParent } from "./types";

/**
 * Nom du métier accordé (§7.3.1). Libellé ROME « A / B suite » : A = tête
 * masculine (k mots), B = tête féminine suivie de la suite commune.
 * Féminin = B entier ; masculin = A + les mots de B après ses k premiers.
 */
export function accorderLibelle(libelle: string, genre: Genre): string {
  const i = libelle.indexOf(" / ");
  if (i === -1) return libelle;
  const a = libelle.slice(0, i).trim();
  const b = libelle.slice(i + 3).trim();
  if (genre === "elle") return b;
  const k = a.split(/\s+/).length;
  const suite = b.split(/\s+/).slice(k);
  return [a, ...suite].join(" ");
}

/** « qu' » ou « que » devant le rappel (§6.5). */
export function eliderQue(amorce: string, suite: string): string {
  const premier = mots(suite)[0] ?? "";
  const elide = commenceParVoyelle(suite) || H_MUETS.has(premier);
  return elide ? `${amorce}'${suite}` : `${amorce}e ${suite}`;
}

/** « de » ou « d' » devant une proposition. */
export function eliderDe(suite: string): string {
  return commenceParVoyelle(suite) ? `d'${suite}` : `de ${suite}`;
}

/**
 * « Vous avez dit qu'[rappel 1] : [metier 1]. Qu'[rappel 2] : [metier 2].
 * Et qu'[rappel 3] : [metier 3]. »
 */
export function composerPourquoi(liens: readonly Pick<LienParent, "rappel" | "metier">[]): string {
  const n = liens.length;
  return liens
    .map((lien, i) => {
      const amorce = i === 0 ? "Vous avez dit qu" : i === n - 1 && n >= 2 ? "Et qu" : "Qu";
      return `${eliderQue(amorce, lien.rappel)} : ${lien.metier}.`;
    })
    .join(" ");
}

/** Un `:` dans un trait de la table devient `,` avant composition (§7.3.4). */
export function traitSansDeuxPoints(trait: string): string {
  return trait.replace(/\s*:\s*/g, ", ");
}

/** « [Trait 1] : [metier 1]. [Trait 2] : [metier 2]. » */
export function composerEnfant(liens: readonly Pick<LienEnfant, "trait" | "metier">[]): string {
  return liens
    .map((lien) => `${majusculeInitiale(traitSansDeuxPoints(lien.trait))} : ${lien.metier}.`)
    .join(" ");
}

/** Une phrase enfant composée, pour T11 et T22. */
export function phraseEnfant(lien: Pick<LienEnfant, "trait" | "metier">): string {
  return composerEnfant([lien]);
}
