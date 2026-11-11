/**
 * Couverture des 21 dimensions par le questionnaire (conception §4),
 * recalculée depuis la définition : un test échoue si une dimension tombe
 * sous 2 questions vues de tous, hors exceptions écrites ici.
 */
import { DIMENSIONS } from "@/lib/donnees/schema-dimensions";
import { champsDeLaQuestion, QUESTIONS } from "./definition";
import type { Dimension, Effet, Option, Question } from "./types";

export interface PresenceQuestion {
  numero: number;
  /** Poids le plus fort d'une option de la question sur la dimension. */
  poidsMax: number;
  /** Vue par une partie des parents seulement (question, variante ou option conditionnelle). */
  variante: boolean;
  /** Seuil ou plafond seulement, sans cible. */
  sensUnique: boolean;
}

export interface CouvertureDimension {
  dim: Dimension;
  questions: PresenceQuestion[];
  vuesDeTous: number;
  vuesDeTousPoids05: number;
  vuesDeTousPoids08: number;
}

/**
 * Dimensions qui reposent sur une seule question vue de tous, et pourquoi
 * c'est accepté (conception §4, critique du tour 2).
 */
export const EXCEPTIONS_COUVERTURE: Partial<Record<Dimension, string>> = {
  horaires:
    "Pas un trait de l'enfant (grille, fiche 21) : un plafond doux en Q29 et deux filtres durs en Q28 (nuit, week-end).",
  stress:
    "Q17 mesure l'urgence directement ; `stress` a 1 067 trous côté métiers, une deuxième question ne comparerait pas plus finement. Depuis l'amélioration 1 de la critique, Q20 n'envoie plus de signal `stress`.",
};

type EffetDimension = Extract<Effet, { dim: Dimension }> & { poids: number };

function effetsDimension(option: Option): EffetDimension[] {
  if (option.effets === "neutre") return [];
  return option.effets.filter(
    (e): e is EffetDimension => e.type === "cible" || e.type === "seuil" || e.type === "plafond",
  );
}

/** Une option est vue de tous si sa question est sans condition, si elle est dans toutes ses variantes, et sans condition elle-même. */
function optionsVuesDeTous(question: Question): Set<Option> {
  const vues = new Set<Option>();
  if (question.si !== undefined) return vues;
  const [premiere, ...autres] = question.variantes;
  for (const champ of premiere.champs) {
    if (champ.type !== "choix_unique" && champ.type !== "choix_multiple") continue;
    for (const option of champ.options) {
      const dansToutesLesVariantes = autres.every((v) =>
        v.champs.some((c) => "options" in c && c.options.includes(option)),
      );
      if (option.si === undefined && dansToutesLesVariantes) vues.add(option);
    }
  }
  return vues;
}

export function couvertureDesDimensions(): CouvertureDimension[] {
  return DIMENSIONS.map((dim) => {
    const questions: PresenceQuestion[] = [];
    for (const question of QUESTIONS) {
      const vues = optionsVuesDeTous(question);
      let poidsTous = 0;
      let poidsVariante = 0;
      let sensUnique = true;
      for (const champ of champsDeLaQuestion(question)) {
        if (champ.type !== "choix_unique" && champ.type !== "choix_multiple") continue;
        for (const option of champ.options) {
          for (const effet of effetsDimension(option)) {
            if (effet.dim !== dim) continue;
            if (effet.type === "cible") sensUnique = false;
            if (vues.has(option)) poidsTous = Math.max(poidsTous, effet.poids);
            else poidsVariante = Math.max(poidsVariante, effet.poids);
          }
        }
      }
      if (poidsTous > 0) {
        questions.push({
          numero: question.numero,
          poidsMax: poidsTous,
          variante: false,
          sensUnique,
        });
      } else if (poidsVariante > 0) {
        questions.push({
          numero: question.numero,
          poidsMax: poidsVariante,
          variante: true,
          sensUnique,
        });
      }
    }
    const tous = questions.filter((q) => !q.variante);
    return {
      dim,
      questions,
      vuesDeTous: tous.length,
      vuesDeTousPoids05: tous.filter((q) => q.poidsMax >= 0.5).length,
      vuesDeTousPoids08: tous.filter((q) => q.poidsMax >= 0.8).length,
    };
  });
}
