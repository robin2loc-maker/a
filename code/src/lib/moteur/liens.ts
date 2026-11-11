/**
 * Ce que reçoivent les explications (conception §9) : des liens « Vous avez
 * dit que… → dans ce métier… », construits sans texte, et les contraintes
 * (études, alternance, expérience citée par la fiche ROME).
 */
import { DIMENSIONS } from "@/lib/donnees/schema-dimensions";
import { arrondi, CONSTANTES } from "./constantes";
import { poidsTerme, sim, similariteMelangee } from "./score";
import type {
  FormationCompatible,
  IndexMoteur,
  LienContrainte,
  LienExplicatif,
  MetierMoteur,
  Profil,
  RefReponse,
  Terme,
} from "./types";

/** Réponses citables d'un terme pour ce métier, la plus forte d'abord. */
function reponsesCitables(terme: Terme, metier: MetierMoteur): RefReponse[] {
  const vues = new Set<string>();
  const refs: RefReponse[] = [];
  for (const s of [...terme.sources].sort((a, b) => b.poids - a.poids)) {
    const citable =
      s.citation === "toujours" ||
      (typeof s.citation === "object" && metier.dimensions.drapeaux[s.citation.siMetier]);
    const cle = `${s.cle}:${s.option}`;
    if (!citable || vues.has(cle)) continue;
    vues.add(cle);
    refs.push({ cle: s.cle, option: s.option });
  }
  return refs;
}

function lien(terme: Terme, metier: MetierMoteur, poidsExplicatif: number): LienExplicatif {
  const c = metier.dimensions.cases[terme.dim];
  const preuves = c?.preuves ?? [];
  const method = c?.method ?? "domaine";
  return {
    dimension: terme.dim,
    type: terme.type,
    poidsExplicatif: arrondi(poidsExplicatif),
    reponses: reponsesCitables(terme, metier),
    metier: {
      valeur: metier.dimensions.vecteur[terme.dim] ?? 0,
      niveau: c?.niveau ?? 0,
      method,
      preuves,
    },
    citable: method === "rome" && preuves.length > 0,
  };
}

const rangDim = (d: LienExplicatif["dimension"]) => DIMENSIONS.indexOf(d);

/** Liens explicatifs d'une piste (§9), six au plus, le cœur citable en tête. */
export function liensExplicatifs(
  profil: Profil,
  termes: readonly Terme[],
  metier: MetierMoteur,
  index: IndexMoteur,
): LienExplicatif[] {
  const L = CONSTANTES.liens;
  const candidats: LienExplicatif[] = [];
  let lienCoeur: LienExplicatif | null = null;
  for (const t of termes) {
    const v = metier.dimensions.vecteur[t.dim] ?? 0;
    // Similarité avec la seule valeur du métier : une phrase sur le métier ne s'appuie que sur ce qu'on en sait.
    const s = sim(t.type, t.valeur, v);
    const l = lien(t, metier, poidsTerme(t, index) * s * (t.type === "cible" ? v : 1));
    if (t.type === "cible" && profil.coeur?.dim === t.dim) lienCoeur = l;
    if (s < L.simMin) continue;
    if (t.type === "cible") {
      const haute = t.valeur >= L.cibleHaute && v >= L.metierHaut;
      const basse = t.valeur < L.cibleHaute && v <= L.metierBasMax && l.citable;
      if (!haute && !basse) continue;
    }
    candidats.push(l);
  }
  candidats.sort(
    (a, b) =>
      Number(b.citable) - Number(a.citable) ||
      b.poidsExplicatif - a.poidsExplicatif ||
      rangDim(a.dimension) - rangDim(b.dimension),
  );
  const coeur = profil.coeur;
  if (
    coeur &&
    lienCoeur?.citable &&
    (metier.dimensions.vecteur[coeur.dim] ?? 0) >= CONSTANTES.couverture
  ) {
    const enTete = lienCoeur;
    return [
      enTete,
      ...candidats.filter(
        (l) => l !== enTete && !(l.dimension === enTete.dimension && l.type === "cible"),
      ),
    ].slice(0, L.max);
  }
  return candidats.slice(0, L.max);
}

/** Les deux termes qui éloignent le plus un métier évoqué (§7.4) : plus grand wₜ × (1 − sₜ). */
export function ecartsEvoque(
  termes: readonly Terme[],
  metier: MetierMoteur,
  index: IndexMoteur,
): LienExplicatif[] {
  return termes
    .map((t) => lien(t, metier, poidsTerme(t, index) * (1 - similariteMelangee(t, metier, index))))
    .sort(
      (a, b) =>
        b.poidsExplicatif - a.poidsExplicatif || rangDim(a.dimension) - rangDim(b.dimension),
    )
    .slice(0, 2);
}

/** Contraintes transmises aux explications (§9, critique 2 R6). */
export function contraintes(
  profil: Profil,
  metier: MetierMoteur,
  formations: readonly FormationCompatible[],
  index: IndexMoteur,
): LienContrainte[] {
  const resultat: LienContrainte[] = [];
  if (profil.refs.etudes) {
    const durees = formations.flatMap((f) => (f.duree ? [f.duree.duree] : []));
    resultat.push({
      type: "etudes",
      reponse: profil.refs.etudes,
      bacPlusMetier: metier.etudes.bac_plus,
      bacPlusMax: metier.acces.bac_plus_max,
      dureeMin: durees.length > 0 ? Math.min(...durees) : null,
    });
  }
  const alternance = profil.bonusMalus.find(
    (b) => b.sens === "bonus" && b.critere === "formation_en_apprentissage",
  );
  const enApprentissage = formations.filter((f) => f.apprentissage).length;
  if (alternance && enApprentissage > 0) {
    resultat.push({
      type: "alternance",
      reponse: alternance.source,
      formationsEnApprentissage: enApprentissage,
    });
  }
  if (metier.acces.condition_experience) {
    const etudesMax = profil.filtres.etudesMax;
    const plusLongue = metier.acces.bac_plus_max ?? metier.etudes.bac_plus;
    resultat.push({
      type: "experience_citee",
      preuve: metier.acces.condition_experience,
      source: index.sourceAcces,
      nature: metier.acces.nature_experience ?? "condition",
      voieLongueOuverte: etudesMax === null || plusLongue <= etudesMax,
    });
  }
  return resultat;
}
