/**
 * Réponses tirées au hasard, à graine fixe (conception §3.6 et §10.2) :
 * chaque question affichée est passée avec une probabilité de 0,1, sinon une
 * option affichée est tirée au hasard (1 à 3 pour un choix multiple).
 *
 * Sert au panel des métiers aimants (data/processed/panel_moteur.json, écrit
 * une fois par scripts/data/panel_moteur.ts) et aux tests de propriétés.
 * Le moteur lui-même ne tire jamais d'aléa.
 */
import { QUESTIONS } from "@/lib/questionnaire/definition";
import { CODES_DEPARTEMENTS, reponsesVides, type Reponses } from "@/lib/questionnaire/reponses";
import { optionsAffichees, questionAffichee, varianteAffichee } from "@/lib/questionnaire/parcours";

/** Générateur pseudo-aléatoire mulberry32 : mêmes graines, mêmes tirages. */
export function generateur(graine: number): () => number {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type OptionsTirage = {
  /** Numéros de questions jamais posées (le panel retire Q23 à Q29). */
  sansQuestions?: readonly number[];
  probabilitePasser?: number;
};

/** Un jeu de réponses tiré au hasard, en suivant le parcours (Q2 décide des questions suivantes). */
export function reponsesAleatoires(alea: () => number, options: OptionsTirage = {}): Reponses {
  const sans = new Set(options.sansQuestions ?? []);
  const passer = options.probabilitePasser ?? 0.1;
  const reponses = reponsesVides();
  const tirer = <T>(liste: readonly T[]): T => liste[Math.floor(alea() * liste.length)];
  for (const question of QUESTIONS) {
    if (sans.has(question.numero) || !questionAffichee(question, reponses)) continue;
    const variante = varianteAffichee(question, reponses);
    if (alea() < passer) {
      reponses.passees.push(question.id);
      continue;
    }
    for (const champ of variante.champs) {
      if (champ.type === "departement") reponses[champ.cle] = tirer(CODES_DEPARTEMENTS);
      if (champ.type !== "choix_unique" && champ.type !== "choix_multiple") continue;
      const affichees = optionsAffichees(champ, reponses);
      if (affichees.length === 0) continue;
      if (champ.type === "choix_unique") {
        reponses[champ.cle] = tirer(affichees).id;
        continue;
      }
      const max = Math.min(champ.max ?? affichees.length, affichees.length, 3);
      const nombre = 1 + Math.floor(alea() * max);
      const restantes = [...affichees];
      const choisies: string[] = [];
      while (choisies.length < nombre && restantes.length > 0) {
        const o = restantes.splice(Math.floor(alea() * restantes.length), 1)[0];
        choisies.push(o.id);
      }
      const exclusives = new Set(affichees.filter((o) => o.exclusive).map((o) => o.id));
      const gardees = choisies.length > 1 ? choisies.filter((id) => !exclusives.has(id)) : choisies;
      reponses[champ.cle] = gardees.length > 0 ? gardees : choisies.slice(0, 1);
    }
  }
  return reponses;
}

/** `nombre` jeux de réponses tirés depuis une même graine. */
export function panelAleatoire(graine: number, nombre: number, options: OptionsTirage = {}) {
  const alea = generateur(graine);
  return Array.from({ length: nombre }, () => reponsesAleatoires(alea, options));
}

/** Méthode du panel des aimants (§3.6) : 200 profils, graine 2026, sans Q23 à Q29. */
export const PANEL_AIMANTS = {
  graine: 2026,
  nombre: 200,
  sansQuestions: [23, 24, 25, 26, 27, 28, 29],
} as const;
