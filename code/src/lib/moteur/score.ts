/**
 * Score d'un métier (conception §3) :
 *   score(m) = A(m) − Σ pénalités(m) + Σ bonus(m)
 *   A(m)     = Σₜ wₜ · sₜ(m) / Σₜ wₜ,  wₜ = Wₜ × k(dₜ)
 *   sₜ(m)    = q · sim(t, v) + (1 − q) · sim(t, v̄_d)
 */
import { DIMENSIONS } from "@/lib/donnees/schema-dimensions";
import { arrondi, CONSTANTES } from "./constantes";
import { critereVrai } from "./filtres";
import { METIERS_CONNUS } from "./metiers-connus";
import type {
  DetailScore,
  Dimension,
  FormationCompatible,
  IndexMoteur,
  MetierMoteur,
  Profil,
  Terme,
  TypeTerme,
} from "./types";

/** Termes du profil, dans l'ordre de `DIMENSIONS`, puis cible, seuil, plafond. */
export function termesDuProfil(profil: Profil): Terme[] {
  const termes: Terme[] = [];
  for (const dim of DIMENSIONS) {
    const c = profil.cibles[dim];
    if (c)
      termes.push({ dim, type: "cible", valeur: c.valeur, poids: c.poids, sources: c.sources });
    const s = profil.seuils[dim];
    if (s)
      termes.push({ dim, type: "seuil", valeur: s.valeur, poids: s.poids, sources: [s.source] });
    const p = profil.plafonds[dim];
    if (p) {
      termes.push({ dim, type: "plafond", valeur: p.valeur, poids: p.poids, sources: [p.source] });
    }
  }
  return termes;
}

/** Similarité d'un terme et d'une valeur de métier (§3.1). */
export function sim(type: TypeTerme, cible: number, x: number): number {
  switch (type) {
    case "cible":
      return 1 - Math.abs(cible - x);
    case "seuil":
      return cible <= 0 ? 1 : 1 - Math.max(0, cible - x) / cible;
    case "plafond":
      return cible >= 1 ? 1 : 1 - Math.max(0, x - cible) / (1 - cible);
  }
}

/** Confiance de la case du métier sur la dimension (§3.3). */
export function confianceCase(metier: MetierMoteur, dim: Dimension, index: IndexMoteur): number {
  const c = metier.dimensions.cases[dim];
  const q = CONSTANTES.q;
  if (!c) return q.domaine;
  switch (c.method) {
    case "rome":
      return c.confiance === "forte" ? q.romeForte : q.romeMoyenne;
    case "rome_absence":
      return index.echecAbsence.has(dim) ? q.romeAbsenceEchec : q.romeAbsence;
    case "llm":
      return q.llm;
    case "domaine":
      return q.domaine;
  }
}

/** Poids effectif d'un terme : wₜ = Wₜ × k(d). */
export function poidsTerme(terme: Terme, index: IndexMoteur): number {
  return terme.poids * index.k[terme.dim];
}

/** sₜ(m) : similarité tirée vers celle d'un métier typique quand la case est mal connue (§3.3). */
export function similariteMelangee(terme: Terme, metier: MetierMoteur, index: IndexMoteur) {
  const v = metier.dimensions.vecteur[terme.dim] ?? index.moyennes[terme.dim];
  const q = confianceCase(metier, terme.dim, index);
  return (
    q * sim(terme.type, terme.valeur, v) +
    (1 - q) * sim(terme.type, terme.valeur, index.moyennes[terme.dim])
  );
}

/** Affinité A(m), arrondie (§3.1, §8.1). */
export function affinite(termes: readonly Terme[], metier: MetierMoteur, index: IndexMoteur) {
  let sw = 0;
  let sws = 0;
  for (const t of termes) {
    const w = poidsTerme(t, index);
    sw += w;
    sws += w * similariteMelangee(t, metier, index);
  }
  return sw > 0 ? arrondi(sws / sw) : CONSTANTES.affiniteNeutre;
}

// ---------------------------------------------------------------------------
// Pénalités de marché (§3.4)
// ---------------------------------------------------------------------------

const lineaire = (x: number, plein: number, nul: number) =>
  Math.min(1, Math.max(0, (nul - x) / (nul - plein)));

/** Fraction de la pénalité de recrutement, ou `null` si la donnée manque. */
export function fractionRecrutement(metier: MetierMoteur): number | null {
  const r = metier.recrutement;
  if (!r) return null;
  return lineaire(
    r.projets,
    CONSTANTES.recrutement.projetsPlein,
    CONSTANTES.recrutement.projetsNul,
  );
}

/** Smic de référence et repère interne du salaire affiché (jamais affiché). */
export function repereSalaire(metier: MetierMoteur): { repere: number; smic: number } | null {
  const s = metier.salaire;
  // Critique 2, R9 : un salaire net ne se compare pas au Smic brut.
  if (s.brut_ou_net !== "brut" || s.periode !== "mensuel") return null;
  const smic = s.smic?.montant_mensuel_brut ?? CONSTANTES.salaire.smicDefaut;
  const repere = s.montant_max === null ? s.montant_min : (s.montant_min + s.montant_max) / 2;
  return { repere, smic };
}

export function fractionSalaire(metier: MetierMoteur): number | null {
  const r = repereSalaire(metier);
  if (!r) return null;
  const { smicPlein, smicNul } = CONSTANTES.salaire;
  return lineaire(r.repere, smicPlein * r.smic, smicNul * r.smic);
}

export function fractionIa(metier: MetierMoteur): number | null {
  const e = metier.exposition_ia;
  if (!e) return null;
  const f = CONSTANTES.ia.niveaux[e.niveau];
  return e.concordance ? f : f * CONSTANTES.ia.nonConcordant;
}

/** Pénalité d'aimant (§3.6). */
export function penaliteAimant(code: string, index: IndexMoteur): number {
  const f = index.frequences.get(code) ?? 0;
  return arrondi(CONSTANTES.aimant.mu * Math.max(0, f - CONSTANTES.aimant.f0));
}

/** Score complet d'un métier, avec ses pénalités et bonus nommés (§3, §4). */
export function scorer(
  profil: Profil,
  termes: readonly Terme[],
  metier: MetierMoteur,
  formations: readonly FormationCompatible[],
  index: IndexMoteur,
): DetailScore {
  const A = affinite(termes, metier, index);
  const fr = fractionRecrutement(metier);
  const fs = fractionSalaire(metier);
  const fi = fractionIa(metier);
  const penalites: Record<string, number> = {
    recrutement: arrondi(
      (fr === null ? index.penaliteMoyenne.recrutement : CONSTANTES.recrutement.max * fr) *
        profil.facteurs.recrute_peu,
    ),
    salaire: arrondi(
      (fs === null ? 0 : CONSTANTES.salaire.max * fs) * profil.facteurs.salaire_debut_bas,
    ),
    ia: arrondi(fi === null ? index.penaliteMoyenne.ia : CONSTANTES.ia.max * fi),
    aimant: penaliteAimant(metier.code_rome, index),
    connu: METIERS_CONNUS.has(metier.code_rome) ? CONSTANTES.connu : 0,
  };
  const bonus: Record<string, number> = {};
  for (const b of profil.bonusMalus) {
    if (!critereVrai(b.critere, metier, formations, profil, index)) continue;
    const cible = b.sens === "bonus" ? bonus : penalites;
    cible[b.critere] = arrondi((cible[b.critere] ?? 0) + b.points);
  }
  const somme = (r: Record<string, number>) => Object.values(r).reduce((s, x) => s + x, 0);
  return {
    affinite: A,
    score: arrondi(A - somme(penalites) + somme(bonus)),
    penalites,
    bonus,
    marche: { recrutement: fr, salaire: fs, ia: fi },
  };
}

/** Somme des trois pénalités de marché d'un score. */
export function penalitesDeMarche(d: DetailScore): number {
  return arrondi(
    (d.penalites.recrutement ?? 0) + (d.penalites.salaire ?? 0) + (d.penalites.ia ?? 0),
  );
}
