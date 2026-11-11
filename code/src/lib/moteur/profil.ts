/**
 * Profil de l'enfant, construit depuis les réponses (conception §1).
 *
 * Réserve R1 (critique 2) : on ne lit que les champs des étapes de
 * `parcours(reponses)`, dans la variante affichée, et seulement les options
 * de `optionsAffichees`. Une réponse devenue sans objet (Q2 modifiée) est
 * ignorée. Une option inconnue de la définition lève une erreur.
 */
import { DIMENSIONS, DRAPEAUX } from "@/lib/donnees/schema-dimensions";
import {
  champsParCle,
  DIMENSIONS_REPLI_COEUR,
  PLAFOND_CONFIANCE_DIRIGER,
  VERSION_QUESTIONNAIRE,
} from "@/lib/questionnaire/definition";
import {
  bilanObservation,
  champsAffiches,
  conditionVraie,
  optionsAffichees,
  parcours,
  valeursDuChamp,
} from "@/lib/questionnaire/parcours";
import type { Reponses } from "@/lib/questionnaire/reponses";
import { CLES_TEXTES_LIBRES, preparerReponseLibre } from "@/lib/questionnaire/textes-libres";
import type { Champ, Dimension, Drapeau, Effet, Option } from "@/lib/questionnaire/types";
import { arrondi, CONSTANTES, ORDRE_DES_REGLES } from "./constantes";
import type { CitationReponse, Cible, Profil, RefReponse, SensUnique, SourceTerme } from "./types";

/** Options connues de chaque clé de choix, toutes variantes confondues. */
const OPTIONS_CONNUES: ReadonlyMap<string, ReadonlySet<string>> = (() => {
  const index = new Map<string, Set<string>>();
  for (const [cle, { champs }] of champsParCle()) {
    for (const champ of champs) {
      if (champ.type !== "choix_unique" && champ.type !== "choix_multiple") continue;
      const ids = index.get(cle) ?? new Set<string>();
      for (const o of champ.options) ids.add(o.id);
      index.set(cle, ids);
    }
  }
  return index;
})();

export class OptionInconnueError extends Error {
  constructor(cle: string, option: string) {
    super(`option inconnue de la définition : ${cle} = « ${option} »`);
    this.name = "OptionInconnueError";
  }
}

function estChoix(champ: Champ): champ is Extract<Champ, { options: readonly Option[] }> {
  return champ.type === "choix_unique" || champ.type === "choix_multiple";
}

/**
 * Réponses réellement affichées par le parcours (R1) : les autres clés sont
 * retirées, et seules les options affichées sont gardées. Un champ masqué par
 * sa condition (`aide_exemple` avec « Pas une chose plus qu'une autre ») est
 * ignoré, et chaque phrase libre est nettoyée (non-réponse, passage de santé :
 * questions ouvertes §3, réserve R3). Le conseiller construit sa charge à
 * partir de ces réponses.
 */
export function reponsesEffectives(reponses: Reponses): Reponses {
  for (const [cle, connues] of OPTIONS_CONNUES) {
    for (const option of valeursDuChamp(reponses, cle)) {
      if (!connues.has(option)) throw new OptionInconnueError(cle, option);
    }
  }
  const effectives: Reponses = { version: reponses.version, passees: [...reponses.passees] };
  for (const { variante } of parcours(reponses)) {
    for (const champ of champsAffiches(variante, reponses)) {
      if (champ.type === "metiers" && reponses[champ.cleAppellations] !== undefined) {
        effectives[champ.cleAppellations] = reponses[champ.cleAppellations];
      }
      const valeur = reponses[champ.cle];
      if (valeur === undefined) continue;
      if (estChoix(champ)) {
        const affichees = new Set(optionsAffichees(champ, reponses).map((o) => o.id));
        const gardees = valeursDuChamp(reponses, champ.cle).filter((id) => affichees.has(id));
        if (gardees.length === 0) continue;
        effectives[champ.cle] = champ.type === "choix_unique" ? gardees[0] : gardees;
      } else if (typeof valeur === "string" && CLES_TEXTES_LIBRES.has(champ.cle)) {
        const texte = preparerReponseLibre(valeur, CLES_TEXTES_LIBRES.get(champ.cle));
        if (texte !== "") effectives[champ.cle] = texte;
      } else {
        effectives[champ.cle] = valeur;
      }
    }
  }
  return effectives;
}

/** Effets des réponses effectives, par clé puis par option (ordre alphabétique : l'ordre de saisie est sans effet). */
function effetsDesReponses(
  effectives: Reponses,
): { ref: RefReponse; option: Option; effet: Effet }[] {
  const champs = new Map<string, Champ>();
  for (const { variante } of parcours(effectives)) {
    for (const champ of variante.champs) champs.set(champ.cle, champ);
  }
  const effets: { ref: RefReponse; option: Option; effet: Effet }[] = [];
  for (const cle of [...champs.keys()].sort()) {
    const champ = champs.get(cle);
    if (champ === undefined || !estChoix(champ)) continue;
    for (const id of [...valeursDuChamp(effectives, cle)].sort()) {
      const option = champ.options.find((o) => o.id === id);
      if (option === undefined || option.effets === "neutre") continue;
      for (const effet of option.effets) effets.push({ ref: { cle, option: id }, option, effet });
    }
  }
  return effets;
}

function citation(option: Option, effectives: Reponses): CitationReponse {
  const regle = option.citation;
  if (regle === undefined) return "jamais";
  if (regle === "toujours") return "toujours";
  if ("si" in regle) return conditionVraie(regle.si, effectives) ? "toujours" : "jamais";
  return { siMetier: regle.siMetier };
}

function plusExigeant(
  actuel: SensUnique | undefined,
  candidat: SensUnique,
  sens: "seuil" | "plafond",
): SensUnique {
  if (actuel === undefined || candidat.poids > actuel.poids) return candidat;
  if (candidat.poids < actuel.poids) return actuel;
  const meilleur =
    sens === "seuil" ? candidat.valeur > actuel.valeur : candidat.valeur < actuel.valeur;
  return meilleur ? candidat : actuel;
}

const saillance = (c: Cible) => c.sommePoids * (c.valeur - 0.5);

/**
 * Construit le profil (§1.3). `appellations` convertit les codes OGR de Q30
 * en codes ROME (table de scripts/data/acces_metiers.py).
 */
export function construireProfil(
  reponses: Reponses,
  appellations: ReadonlyMap<string, string> = new Map(),
): Profil {
  const effectives = reponsesEffectives(reponses);
  const effets = effetsDesReponses(effectives);

  // Cibles : moyenne pondérée, poids plafonné (§1.3, points 2 et 3).
  const accumul = new Map<Dimension, { swv: number; sw: number; sources: SourceTerme[] }>();
  const seuils: Profil["seuils"] = {};
  const plafonds: Profil["plafonds"] = {};
  let coeurFierte: Dimension | null = null;
  let etudesMax: Profil["filtres"]["etudesMax"] = null;
  const refus = new Set<Drapeau>();
  let prive: Profil["filtres"]["prive"] = "public_d_abord";
  const bonusMalus: Profil["bonusMalus"] = [];
  const facteurs = { salaire_debut_bas: 1, recrute_peu: 1 };
  const ordre = new Set<Profil["formations"]["ordre"][number]>();
  let rayon: Profil["formations"]["rayon"] = "region";
  const refs: Profil["refs"] = {};

  for (const { ref, option, effet } of effets) {
    const source = (valeur: number, poids: number): SourceTerme => ({
      ...ref,
      valeur,
      poids,
      citation: citation(option, effectives),
    });
    switch (effet.type) {
      case "cible": {
        const a = accumul.get(effet.dim) ?? { swv: 0, sw: 0, sources: [] };
        a.swv += effet.poids * effet.valeur;
        a.sw += effet.poids;
        a.sources.push(source(effet.valeur, effet.poids));
        accumul.set(effet.dim, a);
        break;
      }
      case "seuil":
      case "plafond": {
        const terme = {
          valeur: effet.valeur,
          poids: effet.poids,
          source: source(effet.valeur, effet.poids),
        };
        const cible = effet.type === "seuil" ? seuils : plafonds;
        cible[effet.dim] = plusExigeant(cible[effet.dim], terme, effet.type);
        break;
      }
      case "coeur":
        coeurFierte = effet.dim;
        break;
      case "filtre_drapeau":
        refus.add(effet.drapeau);
        refs[effet.drapeau] = ref;
        break;
      case "etudes":
        etudesMax = effet.maxAnnees;
        refs.etudes = ref;
        break;
      case "prive":
        prive = effet.regle;
        refs.prive = ref;
        break;
      case "bonus_metier":
      case "malus_metier":
        bonusMalus.push({
          sens: effet.type === "bonus_metier" ? "bonus" : "malus",
          critere: effet.critere,
          points: arrondi(effet.poids * CONSTANTES.pointParPoids),
          source: ref,
        });
        break;
      case "penalite_moteur":
        facteurs[effet.penalite] = Math.max(facteurs[effet.penalite], effet.facteur);
        break;
      case "ordre_formations":
        ordre.add(effet.regle);
        break;
      case "rayon":
        rayon = effet.rayon;
        break;
      case "contexte":
        break;
      default: {
        const jamais: never = effet;
        throw new Error(`effet inconnu : ${JSON.stringify(jamais)}`);
      }
    }
  }

  const dirigerConcordant = conditionVraie(PLAFOND_CONFIANCE_DIRIGER.saufSi, effectives);
  const poidsMaxDiriger = PLAFOND_CONFIANCE_DIRIGER.confianceMax * CONSTANTES.diviseurConfiance;
  const cibles: Profil["cibles"] = {};
  for (const dim of DIMENSIONS) {
    const a = accumul.get(dim);
    if (a === undefined || a.sw <= 0) continue;
    let poids = Math.min(a.sw, CONSTANTES.poidsMaxCible);
    if (dim === PLAFOND_CONFIANCE_DIRIGER.dim && !dirigerConcordant) {
      poids = Math.min(poids, poidsMaxDiriger);
    }
    cibles[dim] = {
      valeur: arrondi(a.swv / a.sw),
      poids: arrondi(poids),
      sommePoids: arrondi(a.sw),
      sources: [...a.sources].sort((x, y) => y.poids - x.poids),
    };
  }

  // Cœur (§1.3, point 5) : la fierté, sinon le repli.
  let coeur: Profil["coeur"] = coeurFierte ? { dim: coeurFierte, origine: "fierte" } : null;
  if (coeur === null) {
    let meilleur: { dim: Dimension; s: number } | null = null;
    for (const dim of DIMENSIONS_REPLI_COEUR) {
      const c = cibles[dim];
      if (!c || c.valeur < CONSTANTES.coeurRepli.valeurMin) continue;
      if (c.sommePoids < CONSTANTES.coeurRepli.sommePoidsMin) continue;
      const s = arrondi(saillance(c));
      if (meilleur === null || s > meilleur.s) meilleur = { dim, s };
    }
    if (meilleur) coeur = { dim: meilleur.dim, origine: "repli" };
  }

  // Intérêts secondaires (§1.3, point 6), sur Σw avant plafond.
  const interetsSecondaires = DIMENSIONS_REPLI_COEUR.filter((dim) => dim !== coeur?.dim)
    .map((dim, i) => ({ dim, i, c: cibles[dim] }))
    .filter(
      (x): x is { dim: Dimension; i: number; c: Cible } =>
        x.c !== undefined &&
        x.c.valeur >= CONSTANTES.interetsSecondaires.valeurMin &&
        x.c.sommePoids >= CONSTANTES.interetsSecondaires.sommePoidsMin,
    )
    .sort((a, b) => arrondi(saillance(b.c)) - arrondi(saillance(a.c)) || a.i - b.i)
    .slice(0, CONSTANTES.interetsSecondaires.nombre)
    .map((x) => x.dim);

  const decrites = new Set<Dimension>([
    ...(Object.keys(cibles) as Dimension[]),
    ...(Object.keys(seuils) as Dimension[]),
    ...(Object.keys(plafonds) as Dimension[]),
  ]);
  const departement = valeursDuChamp(effectives, "departement")[0] ?? null;
  const metiersEvoques: string[] = [];
  for (const ogr of valeursDuChamp(effectives, "metier_evoque_appellations")) {
    const code = appellations.get(ogr);
    if (code !== undefined && !metiersEvoques.includes(code)) metiersEvoques.push(code);
  }

  return {
    version: VERSION_QUESTIONNAIRE,
    cibles,
    seuils,
    plafonds,
    coeur,
    interetsSecondaires,
    filtres: { etudesMax, refus: DRAPEAUX.filter((d) => refus.has(d)), prive },
    bonusMalus,
    facteurs,
    formations: { ordre: ORDRE_DES_REGLES.filter((r) => ordre.has(r)), rayon, departement },
    metiersEvoques: metiersEvoques.slice(0, 2),
    qualite: {
      dimensionsDecrites: decrites.size,
      reponsesObservation: bilanObservation(effectives).repondues,
      insuffisant: decrites.size < CONSTANTES.dimensionsDecritesMin,
    },
    refs,
  };
}
