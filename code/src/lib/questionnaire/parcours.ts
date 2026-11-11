/**
 * Parcours du questionnaire : questions et variantes affichées selon les
 * réponses, numérotation, durée estimée, bilan de l'écran de fin
 * (conception §2 et §6). Fonctions pures.
 */
import {
  ECRANS,
  MIN_REPONSES_OBSERVATION,
  OBSERVATION,
  QUESTIONS,
  SEUIL_PASSEES_MESSAGE_DOUX,
} from "./definition";
import { reponsesVides, type Reponses } from "./reponses";
import type { Champ, Condition, Option, Question, Variante } from "./types";

/** Valeurs données à un champ, sous forme de liste (vide si pas de réponse). */
export function valeursDuChamp(reponses: Reponses, cle: string): string[] {
  const valeur = reponses[cle];
  if (typeof valeur === "string") return valeur.trim() === "" ? [] : [valeur];
  if (Array.isArray(valeur)) return valeur;
  return [];
}

export function conditionVraie(condition: Condition, reponses: Reponses): boolean {
  if ("tous" in condition) return condition.tous.every((c) => conditionVraie(c, reponses));
  if ("non" in condition) return !conditionVraie(condition.non, reponses);
  const valeurs = valeursDuChamp(reponses, condition.cle);
  return valeurs.some((v) => condition.parmi.includes(v));
}

export function questionAffichee(question: Question, reponses: Reponses): boolean {
  return question.si === undefined || conditionVraie(question.si, reponses);
}

/**
 * Première variante dont la condition est vraie. Un test vérifie que chaque
 * question affichée en a une, dans chaque situation ; le repli sur la
 * dernière ne sert qu'à une question pas encore affichable (Q3 avant Q2).
 */
export function varianteAffichee(question: Question, reponses: Reponses): Variante {
  const variante = question.variantes.find(
    (v) => v.si === undefined || conditionVraie(v.si, reponses),
  );
  return variante ?? question.variantes[question.variantes.length - 1];
}

/**
 * Un champ est affiché si sa condition est vraie (`aide_exemple`, masqué
 * quand « Pas une chose plus qu'une autre » est cochée). La réponse d'un
 * champ masqué est gardée mais ignorée (questions ouvertes §2.2).
 */
export function champAffiche(champ: Champ, reponses: Reponses): boolean {
  return champ.si === undefined || conditionVraie(champ.si, reponses);
}

/** Champs affichés d'une variante, dans l'ordre. */
export function champsAffiches(variante: Variante, reponses: Reponses): Champ[] {
  return variante.champs.filter((champ) => champAffiche(champ, reponses));
}

export function optionsAffichees(champ: Champ, reponses: Reponses): Option[] {
  if (champ.type !== "choix_unique" && champ.type !== "choix_multiple") return [];
  return champ.options.filter((o) => o.si === undefined || conditionVraie(o.si, reponses));
}

export interface Etape {
  question: Question;
  variante: Variante;
}

/** Questions affichées, dans l'ordre, avec leur variante. */
export function parcours(reponses: Reponses): Etape[] {
  return QUESTIONS.filter((q) => questionAffichee(q, reponses)).map((question) => ({
    question,
    variante: varianteAffichee(question, reponses),
  }));
}

/**
 * Total de l'en-tête « Question n sur total » : le maximum (28) tant que la
 * situation n'est pas connue, puis le nombre de questions du parcours (§2.3).
 */
export function totalQuestions(reponses: Reponses): number {
  if (valeursDuChamp(reponses, "situation").length === 0) return QUESTIONS.length;
  return parcours(reponses).length;
}

/** Rang d'une question dans le parcours (1 pour la première), ou `null` si elle est sautée. */
export function rangDansLeParcours(question: Question, reponses: Reponses): number | null {
  const rang = parcours(reponses).findIndex((e) => e.question.id === question.id);
  return rang === -1 ? null : rang + 1;
}

/** Durée estimée du parcours, écrans hors questions compris, en secondes (conception §7). */
export function dureeEstimeeSecondes(reponses: Reponses): number {
  const questions = parcours(reponses).reduce((s, e) => s + e.variante.dureeSecondes, 0);
  const ecrans = ECRANS.reduce((s, e) => s + e.dureeSecondes, 0);
  return questions + ecrans;
}

/**
 * Une question a une réponse si au moins un champ affiché de sa variante en a
 * une : un écran dont seule la phrase libre est remplie compte comme répondu.
 */
export function estRepondue(etape: Etape, reponses: Reponses): boolean {
  return champsAffiches(etape.variante, reponses).some(
    (champ) => valeursDuChamp(reponses, champ.cle).length > 0,
  );
}

export type CasFin = "general" | "doux" | "ferme";

export interface BilanObservation {
  repondues: number;
  passees: number;
  /** Réponses qui manquent pour atteindre le minimum (0 si atteint). */
  manque: number;
  cas: CasFin;
}

/**
 * Écran de fin (§2.2 et §6), sur les questions d'observation Q4 à Q20 :
 * moins de 8 réponses → message ferme ; 6 questions passées ou plus → message doux.
 */
export function bilanObservation(reponses: Reponses): BilanObservation {
  const etapes = parcours(reponses).filter(
    (e) => e.question.numero >= OBSERVATION.premier && e.question.numero <= OBSERVATION.dernier,
  );
  const repondues = etapes.filter((e) => estRepondue(e, reponses)).length;
  const passees = etapes.length - repondues;
  const manque = Math.max(0, MIN_REPONSES_OBSERVATION - repondues);
  const cas: CasFin =
    manque > 0 ? "ferme" : passees >= SEUIL_PASSEES_MESSAGE_DOUX ? "doux" : "general";
  return { repondues, passees, manque, cas };
}

/**
 * Parcours types, pour la durée estimée de chaque situation (conception §7) :
 * il suffit des réponses qui choisissent les questions et les variantes.
 */
const parcoursType = (nom: string, valeurs: Record<string, string>) => ({
  nom,
  reponses: { ...reponsesVides(), ...valeurs },
});

export const PARCOURS_TYPES: ReadonlyArray<{ nom: string; reponses: Reponses }> = [
  parcoursType("Première générale (spécialités)", { situation: "premiere_generale" }),
  parcoursType("Terminale générale (spécialités)", { situation: "terminale_generale" }),
  parcoursType("Première ou Terminale technologique", { situation: "terminale_techno" }),
  parcoursType("Bac pro", { situation: "bac_pro" }),
  parcoursType("A déjà le bac, après une formation (réorientation)", {
    situation: "deja_bac",
    apres_bac_activite: "premiere_annee",
    apres_bac_formation: "licence",
  }),
  parcoursType("A déjà le bac, sans formation après", {
    situation: "deja_bac",
    apres_bac_activite: "arrete",
    apres_bac_formation: "aucune",
  }),
  parcoursType("Seconde", { situation: "seconde" }),
  parcoursType("Autre situation", { situation: "autre" }),
];
