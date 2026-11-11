/**
 * Tous les nombres du moteur, avec le paragraphe de docs/conception/moteur.md
 * qui les fixe. Changer une valeur ici change le classement : refaire alors
 * les mesures du §10 et les fixtures de référence.
 */
import type { CritereMetier } from "@/lib/questionnaire/types";

export const VERSION_MOTEUR = "2.4.0";

export const CONSTANTES = {
  /** §1.3 point 2 : plafond du poids d'une cible. */
  poidsMaxCible: 3,
  /** §1.3 point 3 : la confiance du questionnaire vaut Σw / 1,5. */
  diviseurConfiance: 1.5,
  /** §1.3 points 5 et 6 : cœur de repli et intérêts secondaires. */
  coeurRepli: { valeurMin: 0.6, sommePoidsMin: 1 },
  interetsSecondaires: { valeurMin: 0.65, sommePoidsMin: 0.8, nombre: 2 },
  /** §1.3 point 8 et §3.5 : un poids du questionnaire vaut 0,1 point. */
  pointParPoids: 0.1,
  /** §1.3 point 9 : en dessous, profil insuffisant. */
  dimensionsDecritesMin: 6,
  /** §3.1 : affinité d'un profil sans terme. */
  affiniteNeutre: 0.5,
  /** §3.2 : facteur d'une dimension réduite, et règle (critique 2, R2). */
  k: {
    reduit: 0.5,
    casesMin: 5,
    alphaMin: 0.667,
    ecartPaires: 0.15,
    peuDiscriminantes: ["precision", "variete", "equipe"] as const,
  },
  /** §3.3 : confiance de la case, et règle d'échec C (critique 2, R2). */
  q: {
    romeForte: 1,
    romeMoyenne: 0.8,
    romeAbsence: 0.7,
    romeAbsenceEchec: 0.3,
    llm: 0.6,
    domaine: 0.3,
    echecCasesMin: 5,
    echecPartMin: 0.8,
  },
  /** §3.4 : pénalités de marché. */
  recrutement: { max: 0.06, projetsPlein: 500, projetsNul: 2000 },
  salaire: { max: 0.05, smicPlein: 1.05, smicNul: 1.2, smicDefaut: 1867.02 },
  ia: { max: 0.06, niveaux: { faible: 0, modérée: 1 / 3, élevée: 1 }, nonConcordant: 0.5 },
  /** §3.5 : malus des métiers connus. */
  connu: 0.01,
  /**
   * §3.6 : métiers aimants. μ = 0,2 et non 0,15 : recalé une fois sur le
   * panel committé (R4), voir « Notes d'implémentation » du document.
   */
  aimant: { mu: 0.2, f0: 0.05, top: 10 },
  /** §5.2 : paliers du trio (K = rangs examinés, marge sous le premier). */
  paliers: [
    { k: 30, marge: 0.08, grandDomaineStrict: true },
    { k: 60, marge: 0.15, grandDomaineStrict: true },
    { k: Infinity, marge: Infinity, grandDomaineStrict: true },
    { k: Infinity, marge: Infinity, grandDomaineStrict: false },
  ],
  /** §5.1 : au plus deux pistes d'un même grand domaine. */
  maxParGrandDomaine: 2,
  /** §5.2 : valeur à partir de laquelle une piste couvre une dimension (cœur, intérêts). */
  couverture: 0.6,
  bonusInteretSecondaire: 0.02,
  /** §5.2 : candidats transmis au LLM. */
  candidatsTransmis: 15,
  /** §7.2 : écartés. */
  ecartes: {
    vivierMarche: 60,
    deltas: [0, 0.02, 0.05, Infinity],
    max: 5,
    min: 3,
    variantesMax: 1,
    variantesMaxDernierPalier: 3,
    encadrementMax: 1,
    /** Une raison de marché exige une fraction d'au moins 0,5 avant facteur. */
    fractionRaison: 0.5,
  },
  /** §2.5 : « département et voisins ». */
  rayonVoisinsKm: 60,
  rayonTerreKm: 6371,
  /** §8.3 : formations montrées. */
  formationsMontrees: { min: 3, max: 6 },
  tauxSelectif: 20,
  /** §9 : liens explicatifs. */
  liens: { simMin: 0.75, cibleHaute: 0.5, metierHaut: 0.5, metierBasMax: 0.4, max: 6 },
} as const;

/** §2.3 : privé sous contrat gardé avec `public_et_6_types`. */
export const TYPES_PRIVE_GARDES: ReadonlySet<string> = new Set([
  "BTS",
  "BUT",
  "CPGE",
  "CS_FCIL",
  "DN_MADE",
  "DE",
]);

/** §8.3 : familles de formations pour l'ordre. */
export const TYPES_PROFESSIONNALISANTS: ReadonlySet<string> = new Set([
  "BTS",
  "BUT",
  "DEUST",
  "CS_FCIL",
  "BPJEPS",
  "FORMATION_PRO",
]);
export const TYPES_ENCADRES: ReadonlySet<string> = new Set(["BTS", "BUT", "DN_MADE", "DE"]);

/** §8.3 : ordre d'application des règles d'`ordre_formations`. */
export const ORDRE_DES_REGLES = [
  "professionnalisantes_d_abord",
  "encadrees_d_abord",
  "bts_d_abord",
  "courtes_d_abord",
  "apprentissage_d_abord",
  "hors_apprentissage_d_abord",
  "selectives_apres",
] as const;

/** Tous les critères de `CritereMetier` ont une fonction (filtres.ts) : liste pour le test de couverture. */
export const CRITERES_METIER: readonly CritereMetier[] = [
  "independant_possible",
  "secteur_public",
  "formation_en_apprentissage",
  "formations_toutes_en_apprentissage",
  "aucune_formation_un_an_au_plus",
  "etudes_au_dela_de_3_ans",
  "aucune_formation_dans_la_region",
];

/** §8.1 : au plus proche, la demi-valeur vers +∞ (D8). */
export function arrondi(x: number): number {
  return Math.floor(x * 1e6 + 0.5) / 1e6;
}
