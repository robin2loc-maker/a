/**
 * Métiers écartés (conception §7) : bien classés pour l'affinité, mais
 * retirés par un filtre, par une pénalité de marché qui atteint la moitié de
 * son maximum, ou parce qu'ils sont une variante d'une piste. Une raison est
 * toujours définie, et toujours vraie.
 */
import { arrondi, CONSTANTES } from "./constantes";
import { penalitesDeMarche } from "./score";
import { compatibles, type Candidat } from "./selection";
import type { Ecarte, Exclusion, MetierMoteur, Profil, RaisonEcart } from "./types";

export type MetierFiltre = { metier: MetierMoteur; affinite: number; exclusions: Exclusion[] };

type Entree = {
  metier: MetierMoteur;
  affinite: number;
  raisons: RaisonEcart[];
  /** 0 filtre, 1 marché, 2 variante (ordre de tri du §7.2). */
  nature: 0 | 1 | 2;
};

const proches = (a: MetierMoteur, b: MetierMoteur) =>
  a.proches.includes(b.code_rome) || b.proches.includes(a.code_rome);

/**
 * Raisons de marché d'un candidat (§7.2) : seulement une donnée présente dont
 * la fraction atteint 0,5 avant facteur ; l'IA doit être « élevée » et concordante.
 * Triées de la plus forte pénalité à la plus faible (à égalité : recrutement, salaire, IA).
 */
export function raisonsDeMarche(c: Candidat): RaisonEcart[] {
  const { metier, detail } = c;
  const seuil = CONSTANTES.ecartes.fractionRaison;
  const raisons: { r: RaisonEcart; p: number; ordre: number }[] = [];
  const fr = detail.marche.recrutement;
  if (fr !== null && fr >= seuil && metier.recrutement) {
    raisons.push({
      r: {
        code: "recrutement",
        projets: metier.recrutement.projets,
        metierBmo: metier.recrutement.metier_bmo.libelle,
        source: metier.recrutement.source,
      },
      p: detail.penalites.recrutement ?? 0,
      ordre: 0,
    });
  }
  const fs = detail.marche.salaire;
  if (fs !== null && fs >= seuil) {
    raisons.push({
      r: { code: "salaire", salaire: metier.salaire },
      p: detail.penalites.salaire ?? 0,
      ordre: 1,
    });
  }
  const ia = metier.exposition_ia;
  if (ia && ia.niveau === "élevée" && ia.concordance) {
    raisons.push({
      r: { code: "ia", niveau: "élevée", source: ia.source },
      p: detail.penalites.ia ?? 0,
      ordre: 2,
    });
  }
  return raisons.sort((a, b) => b.p - a.p || a.ordre - b.ordre).map((x) => x.r);
}

/** Choix des écartés (§7.2), cinq au plus. */
export function choisirEcartes(
  profil: Profil,
  filtres: readonly MetierFiltre[],
  candidats: readonly Candidat[],
  pistes: readonly Candidat[],
): Ecarte[] {
  const codesPistes = new Set(pistes.map((p) => p.metier.code_rome));
  const scorePiste3 = pistes.length > 0 ? Math.min(...pistes.map((p) => p.detail.score)) : Infinity;
  const affiniteMin = pistes.length > 0 ? Math.min(...pistes.map((p) => p.detail.affinite)) : 0;

  const entrees = new Map<string, Entree>();
  for (const f of filtres) {
    entrees.set(f.metier.code_rome, {
      metier: f.metier,
      affinite: f.affinite,
      raisons: f.exclusions,
      nature: 0,
    });
  }
  for (const c of candidats.slice(0, CONSTANTES.ecartes.vivierMarche)) {
    if (codesPistes.has(c.metier.code_rome)) continue;
    const s = c.detail.score;
    if (!(s < scorePiste3 && scorePiste3 <= arrondi(s + penalitesDeMarche(c.detail)))) continue;
    const raisons = raisonsDeMarche(c);
    if (raisons.length === 0) continue;
    entrees.set(c.metier.code_rome, {
      metier: c.metier,
      affinite: c.detail.affinite,
      raisons,
      nature: 1,
    });
  }
  for (const c of candidats) {
    if (c.detail.score < scorePiste3) break;
    if (codesPistes.has(c.metier.code_rome) || entrees.has(c.metier.code_rome)) continue;
    const piste = pistes.find((p) => !compatibles(p.metier, c.metier));
    if (!piste) continue;
    entrees.set(c.metier.code_rome, {
      metier: c.metier,
      affinite: c.detail.affinite,
      raisons: [{ code: "variante", de: piste.metier.code_rome }],
      nature: 2,
    });
  }

  const evoques = new Set(profil.metiersEvoques);
  const triees = [...entrees.values()].sort(
    (a, b) =>
      b.affinite - a.affinite ||
      a.nature - b.nature ||
      (a.metier.code_rome < b.metier.code_rome ? -1 : 1),
  );
  const { deltas, max, min, variantesMax, variantesMaxDernierPalier, encadrementMax } =
    CONSTANTES.ecartes;
  let choisis: Entree[] = [];
  for (const delta of deltas) {
    const dernier = delta === Infinity;
    choisis = triees.filter((e) => evoques.has(e.metier.code_rome)).slice(0, max);
    let variantes = choisis.filter((e) => e.nature === 2).length;
    let encadrement = choisis.filter((e) => e.raisons[0].code === "encadrement").length;
    for (const e of triees) {
      if (choisis.length >= max) break;
      if (evoques.has(e.metier.code_rome)) continue;
      if (e.affinite < arrondi(affiniteMin - delta)) continue;
      if (choisis.some((x) => proches(x.metier, e.metier))) continue;
      if (e.nature === 2 && variantes >= (dernier ? variantesMaxDernierPalier : variantesMax)) {
        continue;
      }
      const encadre = e.raisons[0].code === "encadrement";
      if (encadre && encadrement >= encadrementMax) continue;
      choisis.push(e);
      if (e.nature === 2) variantes += 1;
      if (encadre) encadrement += 1;
    }
    if (choisis.length >= min) break;
  }
  return choisis.map((e) => ({
    code_rome: e.metier.code_rome,
    libelle: e.metier.libelle,
    affinite: e.affinite,
    raison: e.raisons[0],
    autresRaisons: e.raisons.slice(1),
    evoque: evoques.has(e.metier.code_rome),
  }));
}

/** Toutes les raisons d'un métier qui serait écarté (pour un métier évoqué). */
export function raisonsEcart(
  code: string,
  filtres: readonly MetierFiltre[],
  ecartes: readonly Ecarte[],
): RaisonEcart[] | null {
  const e = ecartes.find((x) => x.code_rome === code);
  if (e) return [e.raison, ...e.autresRaisons];
  const f = filtres.find((x) => x.metier.code_rome === code);
  return f ? f.exclusions : null;
}
