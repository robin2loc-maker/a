/**
 * Filtres durs sur les métiers et les formations montrées (conception §2),
 * critères des bonus et malus (§3.5), ordre des formations (§8.3).
 */
import type { CritereMetier } from "@/lib/questionnaire/types";
import {
  arrondi,
  CONSTANTES,
  TYPES_ENCADRES,
  TYPES_PRIVE_GARDES,
  TYPES_PROFESSIONNALISANTS,
} from "./constantes";
import type {
  Exclusion,
  FormationCompatible,
  IndexMoteur,
  MetierMoteur,
  Profil,
  ResultatFiltre,
} from "./types";

function distanceKm(a: [number, number], lat: number, lon: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat - a[0]) * rad;
  const dLon = (lon - a[1]) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * CONSTANTES.rayonTerreKm * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Formations reliées au métier, sans proximité, triées par code (calculées une fois, à l'indexation). */
export function formationsDeBase(
  metier: MetierMoteur,
  index: Pick<IndexMoteur, "mentions" | "formations" | "dureesParMention">,
): FormationCompatible[] {
  const vues = new Map<number, FormationCompatible>();
  for (const mention of metier.formations) {
    const codes = index.mentions.get(mention.code_formation)?.codes ?? [];
    const duree = index.dureesParMention.get(mention.code_formation) ?? null;
    for (const code of codes) {
      const f = index.formations.get(code);
      if (f === undefined || vues.has(code)) continue;
      vues.set(code, {
        code,
        codeFormation: mention.code_formation,
        intitule: f.intitule,
        type: f.type,
        etablissement: f.etablissement,
        commune: f.commune,
        departement: f.departement,
        region: f.region,
        lien: f.lien,
        prive: f.statut !== "public",
        statut: f.statut,
        apprentissage: f.apprentissage,
        duree,
        tauxAcces: f.tauxAcces,
        confianceMention: mention.confiance,
        distanceKm: null,
        dansLeRayon: true,
      });
    }
  }
  return [...vues.values()].sort((a, b) => a.code - b.code);
}

/** Toutes les formations reliées au métier, avec leur proximité du département de Q26 (§2.5). */
export function formationsDuMetier(
  metier: MetierMoteur,
  profil: Profil,
  index: IndexMoteur,
): FormationCompatible[] {
  const base = index.formationsParMetier.get(metier.code_rome) ?? formationsDeBase(metier, index);
  const { departement, rayon } = profil.formations;
  const centre = departement === null ? undefined : index.departements.get(departement);
  if (!centre) return base;
  return base.map((f) => {
    const gps = index.formations.get(f.code)?.gps ?? null;
    const distance = gps ? arrondi(distanceKm(gps, centre.lat, centre.lon)) : null;
    let dansLeRayon = true;
    if (rayon === "region") dansLeRayon = f.region === centre.region;
    if (rayon === "departement_et_voisins") {
      dansLeRayon =
        f.departement === departement ||
        (distance !== null && distance < CONSTANTES.rayonVoisinsKm);
    }
    return { ...f, distanceKm: distance, dansLeRayon };
  });
}

/** Formation trop longue pour la réponse à Q23 (§2.3) ; une durée inconnue ne passe qu'avec 5 ans ou plus. */
export function tropLongue(f: FormationCompatible, etudesMax: Profil["filtres"]["etudesMax"]) {
  if (etudesMax === null) return false;
  return f.duree === null ? etudesMax <= 3 : f.duree.duree > etudesMax;
}

/** Formation privée écartée par la réponse à Q25 (§2.3). */
export function priveeEcartee(f: FormationCompatible, regle: Profil["filtres"]["prive"]) {
  if (!f.prive || regle === "tout" || regle === "public_d_abord") return false;
  const gardee = f.statut === "prive_sous_contrat" && TYPES_PRIVE_GARDES.has(f.type);
  return !(gardee || (regle === "plus_apprentissage" && f.apprentissage));
}

/** Filtres durs (§2.1), toutes les raisons, dans l'ordre du type `Exclusion`. */
export function filtrer(profil: Profil, metier: MetierMoteur, index: IndexMoteur): ResultatFiltre {
  const { etudesMax, refus, prive } = profil.filtres;
  const exclusions: Exclusion[] = [];
  if (etudesMax !== null && metier.etudes.bac_plus > etudesMax && profil.refs.etudes) {
    exclusions.push({
      code: "etudes_niveau",
      bacPlusMetier: metier.etudes.bac_plus,
      etudesMax,
      reponse: profil.refs.etudes,
    });
  }
  for (const drapeau of refus) {
    const reponse = profil.refs[drapeau];
    if (metier.dimensions.drapeaux[drapeau] && reponse) {
      exclusions.push({ code: "refus", drapeau, reponse });
    }
  }
  if (metier.acces.experience === "texte" && metier.acces.preuve) {
    exclusions.push({ code: "experience", preuve: metier.acces.preuve, source: index.sourceAcces });
  }
  if (metier.acces.experience === "intitule") {
    exclusions.push({
      code: "encadrement",
      preuvesDiriger: metier.dimensions.cases.diriger?.preuves ?? [],
    });
  }
  const toutes = formationsDuMetier(metier, profil, index);
  const formations: FormationCompatible[] = [];
  let parDuree = 0;
  let parPrive = 0;
  for (const f of toutes) {
    const longue = tropLongue(f, etudesMax);
    const privee = priveeEcartee(f, prive);
    if (longue) parDuree += 1;
    if (privee) parPrive += 1;
    if (!longue && !privee) formations.push(f);
  }
  if (formations.length === 0) {
    const durees = toutes.flatMap((f) => (f.duree ? [f.duree.duree] : []));
    exclusions.push({
      code: "formations",
      parDuree,
      parPrive,
      dureeMin: durees.length > 0 ? Math.min(...durees) : null,
      ...(parDuree > 0 && profil.refs.etudes ? { reponseEtudes: profil.refs.etudes } : {}),
      ...(parPrive > 0 && profil.refs.prive ? { reponsePrive: profil.refs.prive } : {}),
    });
  }
  return { exclusions, formations };
}

/** Critère d'un bonus ou d'un malus (§3.5), sur les formations compatibles. */
export function critereVrai(
  critere: CritereMetier,
  metier: MetierMoteur,
  formations: readonly FormationCompatible[],
  profil: Profil,
  index: IndexMoteur,
): boolean {
  switch (critere) {
    case "independant_possible":
      return metier.dimensions.attributs.independant_possible;
    case "secteur_public":
      return metier.dimensions.attributs.secteur_public;
    case "formation_en_apprentissage":
      return formations.some((f) => f.apprentissage);
    case "formations_toutes_en_apprentissage":
      return formations.length > 0 && formations.every((f) => f.apprentissage);
    case "aucune_formation_un_an_au_plus":
      return !formations.some((f) => f.duree !== null && f.duree.duree <= 1);
    case "etudes_au_dela_de_3_ans":
      return metier.etudes.bac_plus > 3;
    case "aucune_formation_dans_la_region": {
      const dep = profil.formations.departement;
      const centre = dep === null ? undefined : index.departements.get(dep);
      if (!centre) return false;
      return !formations.some((f) => f.region === centre.region);
    }
  }
}

type Comparateur = (a: FormationCompatible, b: FormationCompatible) => number;
const avant = (p: (f: FormationCompatible) => boolean): Comparateur => {
  return (a, b) => Number(p(b)) - Number(p(a));
};

/** Formations montrées sous une piste (§8.3) : 3 à 6, une par mention tant qu'il en reste. */
export function formationsMontrees(
  formations: readonly FormationCompatible[],
  profil: Profil,
): FormationCompatible[] {
  const comparateurs: Comparateur[] = [avant((f) => f.dansLeRayon)];
  for (const regle of profil.formations.ordre) {
    switch (regle) {
      case "professionnalisantes_d_abord":
        comparateurs.push(avant((f) => TYPES_PROFESSIONNALISANTS.has(f.type) || f.apprentissage));
        break;
      case "encadrees_d_abord":
        comparateurs.push(avant((f) => TYPES_ENCADRES.has(f.type) || f.apprentissage));
        break;
      case "bts_d_abord":
        comparateurs.push(avant((f) => f.type === "BTS"));
        break;
      case "courtes_d_abord":
        comparateurs.push((a, b) => (a.duree?.duree ?? 99) - (b.duree?.duree ?? 99));
        break;
      case "apprentissage_d_abord":
        comparateurs.push(avant((f) => f.apprentissage));
        break;
      case "hors_apprentissage_d_abord":
        comparateurs.push(avant((f) => !f.apprentissage));
        break;
      case "selectives_apres":
        comparateurs.push(
          avant((f) => f.tauxAcces === null || f.tauxAcces >= CONSTANTES.tauxSelectif),
        );
        break;
    }
  }
  if (profil.filtres.prive !== "tout") comparateurs.push(avant((f) => !f.prive));
  comparateurs.push(avant((f) => f.confianceMention === "haute"));
  comparateurs.push((a, b) => {
    if (a.distanceKm === b.distanceKm) return 0;
    if (a.distanceKm === null) return 1;
    if (b.distanceKm === null) return -1;
    return a.distanceKm - b.distanceKm;
  });
  comparateurs.push((a, b) => a.code - b.code);
  const triees = [...formations].sort((a, b) => {
    for (const c of comparateurs) {
      const r = c(a, b);
      if (r !== 0) return r;
    }
    return 0;
  });
  const max = CONSTANTES.formationsMontrees.max;
  const choisies: FormationCompatible[] = [];
  const mentions = new Set<string>();
  for (const f of triees) {
    if (choisies.length >= max) break;
    if (mentions.has(f.codeFormation)) continue;
    mentions.add(f.codeFormation);
    choisies.push(f);
  }
  for (const f of triees) {
    if (choisies.length >= max) break;
    if (!choisies.includes(f)) choisies.push(f);
  }
  return choisies;
}
